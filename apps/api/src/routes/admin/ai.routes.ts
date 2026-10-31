import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../../middlewares/validate.middleware';
import { auditService } from '../../services/audit.service';
import { AI_PROVIDERS, aiConfigService } from '../../services/ai/ai-config.service';
import { aiService } from '../../services/ai/ai.service';

/**
 * Configuração da IA de criação (`/api/admin/ai`). Só `master`: a guarda está
 * na raiz de `routes/admin/index.ts`.
 *
 * A chave entra por aqui e nunca sai: GET devolve só os 4 últimos caracteres.
 */
const router = Router();

const providerEnum = z.enum(AI_PROVIDERS as [string, ...string[]]);
const modelField = z
  .string()
  .trim()
  .max(120)
  .regex(/^[A-Za-z0-9._-]*$/, 'Use só letras, números, ponto, hífen e sublinhado.')
  .nullable()
  .optional();

const saveSchema = z.object({
  enabled: z.boolean(),
  provider: providerEnum,
  model: modelField,
  editModel: modelField,
  apiKey: z.string().trim().max(500).nullable().optional(),
  clearApiKey: z.boolean().optional(),
  monthlyLimitPerOrg: z.number().int().min(0).max(100_000),
  features: z.object({
    generateImage: z.boolean(),
    editImage: z.boolean(),
    generatePreset: z.boolean(),
  }),
});

const testSchema = z.object({
  provider: providerEnum.optional(),
  apiKey: z.string().trim().max(500).optional(),
  model: modelField,
  editModel: modelField,
});

// GET /api/admin/ai
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await aiConfigService.get();
    res.json(aiConfigService.toPublic(config));
  } catch (error) {
    console.error('[admin/ai] erro ao ler configuração');
    res.status(500).json({ error: 'Erro ao ler a configuração da IA.' });
  }
});

// PUT /api/admin/ai
router.put('/', validateBody(saveSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as z.infer<typeof saveSchema>;
    const saved = await aiConfigService.save({ ...body, provider: body.provider as any });
    void auditService.logFromRequest(req, {
      action: 'admin.ai.config',
      entityType: 'setting',
      entityId: 'ai',
      organizationId: null,
      metadata: {
        enabled: saved.enabled,
        provider: saved.provider,
        model: saved.model,
        monthlyLimitPerOrg: saved.monthlyLimitPerOrg,
        keyChanged: Boolean(body.apiKey?.trim()) || Boolean(body.clearApiKey),
      },
    });
    res.json(aiConfigService.toPublic(saved));
  } catch (error) {
    console.error('[admin/ai] erro ao salvar configuração');
    res.status(500).json({ error: 'Erro ao salvar a configuração da IA.' });
  }
});

// POST /api/admin/ai/test — confere a chave sem gerar imagem
router.post('/test', validateBody(testSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as z.infer<typeof testSchema>;
    const result = await aiService.testConnection({
      provider: body.provider as any,
      apiKey: body.apiKey,
      model: body.model ?? undefined,
      editModel: body.editModel ?? undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ ok: false, message: 'Não foi possível testar a conexão agora.' });
  }
});

export default router;
