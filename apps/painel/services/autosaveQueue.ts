/**
 * Fila de salvamento automático do editor, resistente a queda de internet.
 *
 * Como funciona:
 *  1. Toda alteração chama `schedule(display)`. O último estado fica na memória
 *     e, depois de ~1,5 s, vira rascunho no localStorage (chave por tela), com
 *     o horário. Assim, mesmo sem rede, o trabalho sobrevive a recarregar a aba.
 *  2. Depois de AUTOSAVE_DEBOUNCE_MS sem novas alterações (10 s), o estado é
 *     enviado ao servidor. O rascunho local só é apagado quando o envio termina
 *     e nenhuma alteração mais nova chegou no meio do caminho.
 *  3. Sem internet (`navigator.onLine` falso) ou com erro de rede/5xx, o estado
 *     continua na fila e o envio é refeito quando o evento `online` dispara e
 *     com espera crescente (2 s, 4 s, 8 s... até 30 s).
 *  4. Erro 4xx (plano, validação) não é repetido sozinho: vira estado `error` e
 *     o rascunho local fica guardado.
 */
import type { Display, EditorSaveState } from '../types';

/** Espera depois da última alteração antes de enviar. Troque por 30_000 para o modo econômico. */
export const AUTOSAVE_DEBOUNCE_MS = 10_000;
/** Espera para gravar o rascunho local (barato, evita gravar a cada arrasto). */
export const DRAFT_WRITE_DEBOUNCE_MS = 1_500;
const BACKOFF_BASE_MS = 2_000;
const BACKOFF_MAX_MS = 30_000;

const DRAFT_PREFIX = 'telahub:editor:rascunho:';

export interface EditorDraft {
  v: 1;
  displayId: string;
  /** Horário (ms) da alteração que gerou este rascunho. */
  savedAt: number;
  display: Display;
}

export const draftKey = (displayId: string) => `${DRAFT_PREFIX}${displayId}`;

export function readDraft(displayId: string): EditorDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(displayId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EditorDraft;
    if (!parsed || parsed.v !== 1 || parsed.displayId !== displayId || !parsed.display || !Array.isArray(parsed.display.pages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDraft(display: Display, savedAt: number): boolean {
  try {
    const draft: EditorDraft = { v: 1, displayId: display.id, savedAt, display };
    localStorage.setItem(draftKey(display.id), JSON.stringify(draft));
    return true;
  } catch {
    // Cota do navegador cheia ou modo privado: o envio ao servidor segue valendo.
    return false;
  }
}

export function clearDraft(displayId: string): void {
  try {
    localStorage.removeItem(draftKey(displayId));
  } catch { /* sem localStorage */ }
}

/** Erro de rede, timeout, limite de taxa ou 5xx: vale tentar de novo. */
export function isRetryableError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === undefined) return true;
  return status >= 500 || status === 408 || status === 429;
}

export interface AutosaveQueueOptions {
  displayId: string;
  /** Envia ao servidor (normalmente `saveDisplay`). */
  send: (display: Display) => Promise<void>;
  /** Recebe cada mudança de estado, para o indicador da barra. */
  onState: (state: EditorSaveState) => void;
  /** Chamado quando o servidor recusa (4xx). Mostra a mensagem ao cliente. */
  onRejected?: (error: unknown) => void;
  /**
   * Se devolver false, o rascunho fica só no aparelho (ex.: tela com TV ligada:
   * enviar sozinho publicaria uma cena pela metade ao vivo; só o Salvar manual publica).
   */
  allowSend?: () => boolean;
  debounceMs?: number;
}

export class AutosaveQueue {
  private latest: Display | null = null;
  private latestAt = 0;
  private sendTimer: ReturnType<typeof setTimeout> | null = null;
  private draftTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private inflight: Promise<boolean> | null = null;
  private attempts = 0;
  private lastSavedAt: number | undefined;
  private disposed = false;

  constructor(private readonly options: AutosaveQueueOptions) {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('pagehide', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  /** Há alteração que ainda não chegou ao servidor? */
  hasUnsent(): boolean {
    return this.latest !== null;
  }

  /** Registra o estado mais novo e (re)inicia a contagem do salvamento. */
  schedule(display: Display): void {
    if (this.disposed) return;
    this.latest = display;
    this.latestAt = Date.now();
    this.emit({ state: 'pending' });

    if (this.draftTimer) clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => this.persistDraft(), DRAFT_WRITE_DEBOUNCE_MS);

    if (this.sendTimer) clearTimeout(this.sendTimer);
    this.sendTimer = setTimeout(() => { void this.flushNow(); }, this.options.debounceMs ?? AUTOSAVE_DEBOUNCE_MS);
  }

  /** Envia agora (troca de cena, sair do editor, voltou a internet). Devolve true se está tudo no servidor. */
  flushNow(): Promise<boolean> {
    if (this.inflight) return this.inflight;
    if (this.sendTimer) { clearTimeout(this.sendTimer); this.sendTimer = null; }
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    if (!this.latest) return Promise.resolve(true);

    this.persistDraft();

    if (this.options.allowSend && !this.options.allowSend()) {
      this.emit({ state: 'saved', lastSavedAt: Date.now(), localOnly: true });
      return Promise.resolve(false);
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.emit({ state: 'offline', localOnly: true, lastSavedAt: this.lastSavedAt });
      return Promise.resolve(false);
    }

    this.inflight = this.sendLatest().finally(() => { this.inflight = null; });
    return this.inflight;
  }

  /** O Salvar manual já enviou `display`: limpa a fila e o rascunho se nada mais novo existe. */
  markSaved(display: Display): void {
    if (this.latest && this.latest !== display) {
      // Há alteração posterior ao que foi salvo: mantém na fila.
      this.lastSavedAt = Date.now();
      return;
    }
    this.latest = null;
    this.attempts = 0;
    this.clearTimers();
    clearDraft(this.options.displayId);
    this.lastSavedAt = Date.now();
    this.emit({ state: 'saved', lastSavedAt: this.lastSavedAt });
  }

  /** Para os timers e os eventos. Com `flush`, tenta enviar o que sobrou (ao sair do editor). */
  dispose(flush = true): void {
    if (this.disposed) return;
    if (flush && this.latest) { this.persistDraft(); void this.flushNow(); }
    this.disposed = true;
    this.clearTimers();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('pagehide', this.handlePageHide);
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  // ---------------------------------------------------------------------------

  private async sendLatest(): Promise<boolean> {
    const snapshot = this.latest;
    const at = this.latestAt;
    if (!snapshot) return true;
    this.emit({ state: 'saving', lastSavedAt: this.lastSavedAt });
    try {
      await this.options.send(snapshot);
      this.attempts = 0;
      this.lastSavedAt = Date.now();
      if (this.latestAt === at) {
        this.latest = null;
        clearDraft(this.options.displayId);
        this.emit({ state: 'saved', lastSavedAt: this.lastSavedAt });
        return true;
      }
      // Houve edição durante o envio: o estado novo segue na fila.
      this.emit({ state: 'pending', lastSavedAt: this.lastSavedAt });
      if (!this.sendTimer) {
        this.sendTimer = setTimeout(() => { void this.flushNow(); }, this.options.debounceMs ?? AUTOSAVE_DEBOUNCE_MS);
      }
      return false;
    } catch (error) {
      if (isRetryableError(error)) {
        this.emit({ state: 'offline', localOnly: true, lastSavedAt: this.lastSavedAt });
        this.scheduleRetry();
      } else {
        this.emit({ state: 'error', localOnly: true, lastSavedAt: this.lastSavedAt });
        this.options.onRejected?.(error);
      }
      return false;
    }
  }

  private scheduleRetry(): void {
    if (this.disposed) return;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const wait = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** this.attempts);
    this.attempts += 1;
    this.retryTimer = setTimeout(() => { void this.flushNow(); }, wait);
  }

  private persistDraft(): void {
    if (this.draftTimer) { clearTimeout(this.draftTimer); this.draftTimer = null; }
    if (this.latest) writeDraft(this.latest, this.latestAt);
  }

  private clearTimers(): void {
    for (const timer of [this.sendTimer, this.draftTimer, this.retryTimer]) if (timer) clearTimeout(timer);
    this.sendTimer = this.draftTimer = this.retryTimer = null;
  }

  private emit(state: EditorSaveState): void {
    if (!this.disposed) this.options.onState(state);
  }

  private handleOnline = () => {
    if (this.latest) { this.attempts = 0; void this.flushNow(); }
  };

  private handleOffline = () => {
    if (this.latest) this.emit({ state: 'offline', localOnly: true, lastSavedAt: this.lastSavedAt });
  };

  private handlePageHide = () => {
    // Síncrono: é o último momento garantido para guardar o rascunho.
    this.persistDraft();
  };

  private handleVisibility = () => {
    if (document.visibilityState === 'hidden' && this.latest) {
      this.persistDraft();
      void this.flushNow();
    }
  };
}

export function createAutosaveQueue(options: AutosaveQueueOptions): AutosaveQueue {
  return new AutosaveQueue(options);
}
