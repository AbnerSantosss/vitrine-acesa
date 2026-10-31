import { displayRepository, TenantScope } from '../repositories/display.repository';
import { resolveDefaultOrganizationId } from './organization.service';
import { isSameTenant, TenantScopeError } from '../middlewares/tenant.middleware';

/**
 * Estratégia de persistência do campo `orientation`:
 * Como o banco não possui uma coluna dedicada para `orientation`,
 * armazenamos dentro do campo `pages` (Text/JSON) como um wrapper:
 *   { "__orientation": "vertical", "items": [ ...pages ] }
 *
 * Na leitura, extraímos o orientation e retornamos o array de pages
 * normalmente. Formato antigo (array puro) continua compatível.
 */

interface PagesWrapper {
  __orientation?: string;
  /** Mural de TVs (videowall). Ausente ou null = tela comum. */
  __wall?: DisplayWall | null;
  items: any[];
}

export interface DisplayWall {
  cols: number;
  rows: number;
}

export const WALL_MAX = 6;

/**
 * Normaliza o mural. Só vale como mural quando há mais de uma TV
 * (cols * rows > 1); 1x1 ou valor inválido vira null (tela comum).
 */
export function normalizeWall(raw: any): DisplayWall | null {
  if (!raw || typeof raw !== 'object') return null;
  const cols = Math.trunc(Number(raw.cols));
  const rows = Math.trunc(Number(raw.rows));
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) return null;
  if (cols < 1 || rows < 1 || cols > WALL_MAX || rows > WALL_MAX) return null;
  if (cols * rows <= 1) return null;
  return { cols, rows };
}

// Displays antigos (pré-refatoração para react-grid-layout) guardavam os widgets
// da cena em `page.widgets` (posicionamento absoluto), não em `page.layout` (grid).
// O Editor atual só entende `layout` — sem essa normalização, abrir uma dessas
// páginas quebra o Editor (`activePage.layout` undefined). Não convertemos o
// conteúdo automaticamente (formatos incompatíveis demais para mapear com segurança);
// só garantimos que `layout` exista como array vazio, preservando `widgets` no dado
// bruto para uma migração manual futura, se necessário.
function normalizePage(page: any): any {
  if (page && !Array.isArray(page.layout)) {
    return { ...page, layout: [] };
  }
  return page;
}

function parsePagesField(raw: string | any): { pages: any[]; orientation?: string; wall: DisplayWall | null } {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

  // Novo formato wrapper: { __orientation, items }
  if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.items)) {
    return {
      pages: parsed.items.map(normalizePage),
      orientation: parsed.__orientation || undefined,
      wall: normalizeWall(parsed.__wall),
    };
  }

  // Formato legado: array direto de pages
  if (Array.isArray(parsed)) {
    return { pages: parsed.map(normalizePage), orientation: undefined, wall: null };
  }

  return { pages: [], orientation: undefined, wall: null };
}

function serializePagesField(pages: any, orientation?: string, wall?: DisplayWall | null): string {
  const pagesArray = Array.isArray(pages) ? pages : (typeof pages === 'string' ? JSON.parse(pages) : []);

  // Sem orientation usa o wrapper mesmo assim, para consistência futura.
  const wrapper: PagesWrapper = { items: pagesArray };
  if (orientation) wrapper.__orientation = orientation;
  const normalizedWall = normalizeWall(wall);
  if (normalizedWall) wrapper.__wall = normalizedWall;
  return JSON.stringify(wrapper);
}

export class DisplayService {
  /**
   * Lista displays do tenant. `tenantId` null só chega aqui via role `master`
   * sem organização escolhida (leitura de plataforma).
   */
  async getAll(tenantId?: TenantScope) {
    const displays = await displayRepository.findAll(tenantId);
    return displays.map((d) => {
      const { pages, orientation, wall } = parsePagesField(d.pages);
      return {
        ...d,
        pages,
        orientation,
        wall,
      };
    });
  }

  /**
   * Busca sem escopo de tenant. Usado só pelas rotas PÚBLICAS do Player
   * (`/api/displays/player/:id`), onde não existe usuário autenticado e o id do
   * display já é o segredo compartilhado com a TV.
   */
  async getById(id: string) {
    const display = await displayRepository.findById(id);
    if (!display) return null;
    const { pages, orientation, wall } = parsePagesField(display.pages);
    return {
      ...display,
      pages,
      orientation,
      wall,
    };
  }

  /** Busca escopada: retorna null quando o display é de outro tenant. */
  async getByIdScoped(id: string, tenantId: TenantScope) {
    const display = await displayRepository.findByIdScoped(id, tenantId);
    if (!display) return null;
    const { pages, orientation, wall } = parsePagesField(display.pages);
    return {
      ...display,
      pages,
      orientation,
      wall,
    };
  }

  async getBySlug(slug: string) {
    const display = await displayRepository.findBySlug(slug);
    if (!display) return null;
    const { pages, orientation, wall } = parsePagesField(display.pages);
    return {
      ...display,
      pages,
      orientation,
      wall,
    };
  }

  /**
   * Conteúdo do player por token público OU slug.
   *
   * O slug é adivinhável e segue aceito só para não derrubar TV já pareada;
   * URL nova usa `publicToken`.
   */
  async getByPublicRef(ref: string) {
    const display = await displayRepository.findByPublicRef(ref);
    if (!display) return null;
    const { pages, orientation, wall } = parsePagesField(display.pages);
    return {
      ...display,
      pages,
      orientation,
      wall,
    };
  }

  // Retorna apenas o updatedAt — query ultra-leve para o Player checar versão
  async getVersionBySlug(slug: string) {
    return displayRepository.findVersionBySlug(slug);
  }

  /** Versão por token público ou slug. */
  async getVersionByPublicRef(ref: string) {
    return displayRepository.findVersionByPublicRef(ref);
  }

  /**
   * Cria ou sobrescreve um display DENTRO do tenant.
   *
   * O `organizationId` é imposto pelo servidor a partir de `tenantId` — qualquer
   * valor vindo do corpo da requisição é ignorado. Sobrescrever um display de
   * outro tenant lança `TenantScopeError` (a rota traduz para 404).
   */
  async save(
    data: {
      id?: string;
      name: string;
      slug: string;
      pages: any;
      coverImage?: string | null;
      orientation?: string;
      /** undefined = manter o mural que já existe; null = tela comum. */
      wall?: DisplayWall | null;
    },
    tenantId: TenantScope
  ): Promise<{ display: any; created: boolean }> {
    let existingOrganizationId: string | null | undefined;
    let existingWall: DisplayWall | null = null;
    let created = true;

    if (data.id) {
      const existing = await displayRepository.findById(data.id);
      if (existing) {
        if (!isSameTenant(existing.organizationId, tenantId)) {
          throw new TenantScopeError('Display não encontrado.');
        }
        existingOrganizationId = existing.organizationId;
        try {
          existingWall = parsePagesField(existing.pages).wall;
        } catch {
          existingWall = null;
        }
        created = false;
      }
    }

    // Cliente antigo que não manda o campo wall não pode desfazer um mural sem querer.
    const wall = data.wall === undefined ? existingWall : normalizeWall(data.wall);
    const pagesStr = serializePagesField(data.pages, data.orientation, wall);

    // Toda Display precisa pertencer a uma Organização. Prioridade:
    // 1) escopo do tenant da requisição; 2) organização que o display já tinha
    // (master operando sem escolher tenant); 3) organização padrão.
    const organizationId =
      (tenantId ?? undefined) ?? existingOrganizationId ?? (await resolveDefaultOrganizationId());

    // `Display.slug` é único globalmente porque alimenta a URL pública do
    // Player (`/player/:slug`) — não pode ser único por organização sem tornar
    // essa rota ambígua. Como consequência, devolver um erro de conflito na
    // criação revelaria a um tenant que aquele slug já existe em outro. Então,
    // ao criar, resolvemos a colisão em silêncio com um sufixo.
    const slug = created ? await this.resolveAvailableSlug(data.slug) : data.slug;

    const result = await displayRepository.upsert({
      id: data.id,
      name: data.name,
      slug,
      pages: pagesStr,
      coverImage: data.coverImage,
      organizationId,
    });
    // Return with parsed pages and orientation
    const parsed = parsePagesField(result.pages);
    return {
      display: { ...result, pages: parsed.pages, orientation: parsed.orientation, wall: parsed.wall },
      created,
    };
  }

  /**
   * Devolve o `slug` pedido se estiver livre; caso contrário acrescenta um
   * sufixo até achar um disponível. Nunca informa ao chamador que houve
   * colisão — evitar esse vazamento entre tenants é justamente o objetivo.
   */
  private async resolveAvailableSlug(desired: string): Promise<string> {
    const base = desired.trim() || 'display';

    if (!(await displayRepository.findBySlug(base))) return base;

    for (let suffix = 2; suffix <= 20; suffix++) {
      const candidate = `${base}-${suffix}`;
      if (!(await displayRepository.findBySlug(candidate))) return candidate;
    }

    // Fallback improvável: sufixo aleatório curto.
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
      if (!(await displayRepository.findBySlug(candidate))) return candidate;
    }

    throw new Error('Não foi possível gerar um slug disponível para o display.');
  }

  /** Delete sem escopo — uso interno/scripts. */
  async delete(id: string) {
    return displayRepository.delete(id);
  }

  /** Delete escopado: retorna false quando o display não existe no tenant. */
  async deleteScoped(id: string, tenantId: TenantScope): Promise<boolean> {
    const count = await displayRepository.deleteScoped(id, tenantId);
    return count > 0;
  }

  /**
   * Valida que TODOS os ids informados pertencem ao tenant. Retorna a lista de
   * ids que não pertencem (vazia = tudo ok).
   */
  async findForeignDisplayIds(ids: string[], tenantId: TenantScope): Promise<string[]> {
    const unique = Array.from(new Set(ids));
    if (unique.length === 0) return [];
    const found = await displayRepository.findManyByIds(unique, tenantId);
    const foundIds = new Set(found.map((d) => d.id));
    return unique.filter((id) => !foundIds.has(id));
  }
}

export const displayService = new DisplayService();
