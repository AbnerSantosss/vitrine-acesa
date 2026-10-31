import crypto from 'node:crypto';

/**
 * Cifra segredos guardados na tabela `Setting` (hoje: a chave da API de IA).
 *
 * AES-256-GCM com IV aleatório por gravação. O texto salvo tem o formato
 * `enc:v1:<iv>:<tag>:<dados>`, tudo em base64url, para que um valor cifrado
 * nunca seja confundido com um valor em texto puro.
 *
 * Chave: `SETTINGS_ENCRYPTION_KEY` (qualquer texto longo; é passado por SHA-256
 * para virar 32 bytes). Sem ela, a chave é derivada do `JWT_SECRET`. Isso
 * funciona, mas amarra os segredos ao JWT: trocar o `JWT_SECRET` torna os
 * valores já cifrados ilegíveis e obriga a cadastrar a chave da IA de novo.
 * Por isso o recomendado em produção é definir `SETTINGS_ENCRYPTION_KEY`.
 */

const PREFIX = 'enc:v1:';
const DEV_FALLBACK = 'officecom-display-secret';

function resolveKey(): Buffer {
  const explicit = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (explicit) {
    return crypto.createHash('sha256').update(`telahub-settings:${explicit}`).digest();
  }
  const jwt = process.env.JWT_SECRET?.trim() || DEV_FALLBACK;
  return crypto.createHash('sha256').update(`telahub-settings-from-jwt:${jwt}`).digest();
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', resolveKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${data.toString('base64url')}`;
}

/**
 * Decifra. Devolve `null` quando o valor não pode ser lido (chave trocada ou
 * dado corrompido): quem chama trata como "sem chave cadastrada", em vez de
 * derrubar a rota. Nunca loga o conteúdo.
 */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!isEncryptedSecret(stored)) return null;
  try {
    const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(':');
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', resolveKey(), Buffer.from(ivB64, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const plain = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}

/** Só os 4 últimos caracteres, para mostrar no admin sem expor a chave. */
export function maskSecret(plain: string | null | undefined): string | null {
  if (!plain) return null;
  const tail = plain.slice(-4);
  return `••••${tail}`;
}
