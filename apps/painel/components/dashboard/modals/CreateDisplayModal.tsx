import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Plus, Minus, Monitor, Tv, X, Zap, LayoutGrid } from 'lucide-react';
import type { DisplayWall } from '../../../types';
import { getBillingSnapshot, hasFeature } from '../../../services/billing';

const WALL_FEATURE = 'videowall';
const WALL_MAX = 6;

interface CreateDisplayModalProps {
  open: boolean;
  onClose: () => void;
  newDisplayName: string;
  setNewDisplayName: (value: string) => void;
  newDisplayOrientation: 'horizontal' | 'vertical';
  setNewDisplayOrientation: (value: 'horizontal' | 'vertical') => void;
  onSubmit: (e: React.FormEvent) => void;
  /** Videowall (opcional): null = uma TV. */
  newDisplayWall?: DisplayWall | null;
  setNewDisplayWall?: (value: DisplayWall | null) => void;
  /** Master não passa pela trava de plano. */
  wallAlwaysAllowed?: boolean;
}

export const CreateDisplayModal: React.FC<CreateDisplayModalProps> = ({
  open,
  onClose,
  newDisplayName,
  setNewDisplayName,
  newDisplayOrientation,
  setNewDisplayOrientation,
  onSubmit,
  newDisplayWall,
  setNewDisplayWall,
  wallAlwaysAllowed = false,
}) => {
  const [showError, setShowError] = React.useState(false);
  // null = plano ainda não carregou ou conta sem assinatura: não bloqueia, o servidor decide.
  const [planFeatures, setPlanFeatures] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (!open || !setNewDisplayWall) return;
    let alive = true;
    getBillingSnapshot().then(snapshot => {
      if (alive) setPlanFeatures(snapshot?.subscription?.plan?.features ?? null);
    });
    return () => { alive = false; };
  }, [open, setNewDisplayWall]);

  const wallLocked = !wallAlwaysAllowed && !hasFeature(planFeatures, WALL_FEATURE);
  const wallOn = Boolean(newDisplayWall && newDisplayWall.cols * newDisplayWall.rows > 1);

  React.useEffect(() => {
    if (wallLocked && wallOn) setNewDisplayWall?.(null);
  }, [wallLocked, wallOn, setNewDisplayWall]);

  const changeWall = (key: 'cols' | 'rows', delta: number) => {
    if (!newDisplayWall || !setNewDisplayWall) return;
    const next = { ...newDisplayWall, [key]: Math.max(1, Math.min(WALL_MAX, newDisplayWall[key] + delta)) };
    // 1×1 deixa de ser videowall: volta para "Uma TV".
    setNewDisplayWall(next.cols * next.rows > 1 ? next : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onSubmit(e);
  };

  React.useEffect(() => {
    if (newDisplayName.trim()) {
      setShowError(false);
    }
  }, [newDisplayName]);

  React.useEffect(() => {
    if (!open) {
      setShowError(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-borda">
          <DialogTitle className="font-bold text-lg flex items-center gap-2 text-tinta">
            <Plus className="text-marca" size={20} /> Nova Tela
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="size-11 md:size-8 rounded-lg text-tinta-3 hover:text-tinta" aria-label="Fechar">
              <X size={18} />
            </Button>
          </DialogClose>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2 relative">
            <label className="block text-sm font-semibold text-tinta-2 pl-0.5">Nome do Dispositivo</label>
            <Input
              autoFocus
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Ex: Recepção, Vitrine..."
              className={`w-full bg-papel border text-tinta text-base md:text-sm placeholder:text-tinta-3 focus-visible:ring-3 h-11 rounded-xl transition-colors ${
                showError 
                  ? 'border-danger focus-visible:ring-danger/30' 
                  : 'border-borda-3 focus-visible:border-marca focus-visible:ring-ring/30'
              }`}
            />
            {showError && (
              <div className="absolute -top-1.5 right-0 bg-danger text-papel text-[13px] font-semibold px-3 py-1 rounded-md shadow-flutuante flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-papel" aria-hidden="true"></span>
                <span>Por favor, insira o nome da tela</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-tinta-2 pl-0.5">Orientação da Tela</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewDisplayOrientation('horizontal')}
                className={`orientation-btn ${newDisplayOrientation === 'horizontal' ? 'active' : ''}`}
              >
                <div className="w-16 h-9 rounded orientation-preview-box">
                  <Monitor size={14} className={newDisplayOrientation === 'horizontal' ? 'text-marca' : 'text-tinta-3'} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Horizontal</p>
                  <p className="text-[13px] text-tinta-3 mt-0.5">16:9 (TV ou monitor)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNewDisplayOrientation('vertical')}
                className={`orientation-btn ${newDisplayOrientation === 'vertical' ? 'active' : ''}`}
              >
                <div className="w-9 h-16 rounded orientation-preview-box">
                  <Tv size={14} className={newDisplayOrientation === 'vertical' ? 'text-marca' : 'text-tinta-3'} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Vertical</p>
                  <p className="text-[13px] text-tinta-3 mt-0.5">9:16 (totem)</p>
                </div>
              </button>
            </div>
          </div>

          {setNewDisplayWall && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-tinta-2 pl-0.5">Quantas TVs</label>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Quantas TVs">
                <button
                  type="button"
                  aria-pressed={!wallOn}
                  onClick={() => setNewDisplayWall(null)}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                    !wallOn ? 'border-marca bg-marca/10 text-tinta' : 'border-borda-3 text-tinta-2 hover:bg-papel-3'
                  }`}
                >
                  Uma TV
                </button>
                <button
                  type="button"
                  aria-pressed={wallOn}
                  disabled={wallLocked}
                  onClick={() => setNewDisplayWall(newDisplayWall && wallOn ? newDisplayWall : { cols: 2, rows: 1 })}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    wallOn ? 'border-marca bg-marca/10 text-tinta' : 'border-borda-3 text-tinta-2 hover:bg-papel-3'
                  }`}
                >
                  <LayoutGrid size={16} aria-hidden="true" /> Várias TVs (videowall)
                </button>
              </div>

              {wallLocked && (
                <p className="text-[13px] text-tinta-3 leading-snug flex items-start gap-2">
                  <span className="shrink-0 rounded-md bg-papel-3 border border-borda-3 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-tinta-2">
                    Enterprise
                  </span>
                  <span>O videowall espalha uma cena por várias TVs e faz parte do plano Enterprise.</span>
                </p>
              )}

              {wallOn && newDisplayWall && (
                <div className="rounded-xl border border-borda-3 p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'cols', label: 'Lado a lado' },
                      { key: 'rows', label: 'Uma acima da outra' },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <p className="text-[13px] font-semibold text-tinta-2">{label}</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Menos TVs: ${label.toLowerCase()}`}
                            disabled={newDisplayWall[key] <= 1}
                            onClick={() => changeWall(key, -1)}
                            className="size-11 rounded-lg border border-borda-3 text-tinta-2 hover:bg-papel-3 disabled:opacity-40 flex items-center justify-center"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center text-base font-bold text-tinta" aria-live="polite">
                            {newDisplayWall[key]}
                          </span>
                          <button
                            type="button"
                            aria-label={`Mais TVs: ${label.toLowerCase()}`}
                            disabled={newDisplayWall[key] >= WALL_MAX}
                            onClick={() => changeWall(key, 1)}
                            className="size-11 rounded-lg border border-borda-3 text-tinta-2 hover:bg-papel-3 disabled:opacity-40 flex items-center justify-center"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div
                      aria-hidden="true"
                      className="grid gap-1 w-full"
                      style={{
                        gridTemplateColumns: `repeat(${newDisplayWall.cols}, minmax(0, 1fr))`,
                        maxWidth: `${Math.min(100, newDisplayWall.cols * (newDisplayOrientation === 'vertical' ? 12 : 22))}%`,
                      }}
                    >
                      {Array.from({ length: newDisplayWall.cols * newDisplayWall.rows }, (_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm border border-marca/50 bg-marca/10 text-[11px] font-bold text-tinta-2 flex items-center justify-center ${
                            newDisplayOrientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'
                          }`}
                        >
                          {(i % newDisplayWall.cols) + 1}-{Math.floor(i / newDisplayWall.cols) + 1}
                        </div>
                      ))}
                    </div>
                    <p className="text-[13px] text-tinta-3 text-center">
                      {newDisplayWall.cols * newDisplayWall.rows} TVs formando uma tela só. Cada TV mostra o seu pedaço.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-11 md:h-10 px-5 rounded-lg text-tinta-2 font-semibold hover:bg-papel-3 hover:text-tinta"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              className="h-11 md:h-10 px-6 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Zap size={16} className="fill-current" aria-hidden="true" /> Criar Tela
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
