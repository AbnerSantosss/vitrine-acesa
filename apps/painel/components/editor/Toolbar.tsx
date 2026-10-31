import type { EditorSaveState } from '../../types';
import React, { useEffect, useRef, useState } from 'react';
import {
  CloudCheck,
  CloudOff,
  Eye,
  Home,
  Layers,
  LayoutGrid,
  Loader2,
  Maximize,
  Minimize,
  PenLine,
  Redo2,
  Save,
  Send,
  TriangleAlert,
  Undo2,
} from 'lucide-react';
import { Display, Page } from '../../types';
import './BrandChrome.css';

interface ToolbarProps {
  saveState?: EditorSaveState;
  onPreview?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRename?: (name: string) => void;
  onOpenLayers?: () => void;
  display: Display;
  activePage: Page;
  isSaving: boolean;
  handleSave: () => void;
  showLeftSidebar: boolean;
  setShowLeftSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRightSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  showLayersModal: boolean;
  setShowLayersModal: React.Dispatch<React.SetStateAction<boolean>>;
  onGoHome: () => void;
}

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/** Texto, ícone e dica do selo de salvamento. null = não mostrar nada. */
const describeSaveState = (saveState: EditorSaveState) => {
  const time = formatTime(saveState.lastSavedAt);
  switch (saveState.state) {
    case 'saving':
      return { tone: 'saving', label: 'Salvando…', Icon: Loader2, title: 'Salvando as alterações' };
    case 'pending':
      return { tone: 'pending', label: 'Alterações pendentes', Icon: PenLine, title: 'As alterações vão ser salvas em instantes' };
    case 'offline':
      return {
        tone: 'offline',
        label: 'Sem internet, salvo neste aparelho',
        Icon: CloudOff,
        title: time ? `Guardado neste aparelho às ${time}. Envia quando a internet voltar.` : 'Envia quando a internet voltar.',
      };
    case 'error':
      return { tone: 'error', label: 'Erro ao salvar', Icon: TriangleAlert, title: 'Não deu para salvar. Tente de novo.' };
    case 'saved':
    case 'idle':
      if (saveState.state === 'idle' && !saveState.lastSavedAt) return null;
      return {
        tone: 'saved',
        label: saveState.localOnly ? 'Salvo neste aparelho' : 'Salvo',
        Icon: CloudCheck,
        title: time ? `Salvo às ${time}` : 'Tudo salvo',
      };
    default:
      return null;
  }
};

/** Nome da tela, clicável para renomear quando o Editor passa onRename. */
const DisplayName: React.FC<{ name: string; onRename?: (name: string) => void }> = ({ name, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (!onRename) return <h1 className="hub-toolbar__name" title={name}>{name}</h1>;

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== name) onRename(next);
    else setDraft(name);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="hub-toolbar__name-input"
        value={draft}
        maxLength={80}
        aria-label="Nome da tela"
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(name);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <h1 className="hub-toolbar__name-wrap">
      <button type="button" className="hub-toolbar__name hub-toolbar__name-btn" title="Clique para renomear" onClick={() => setEditing(true)}>
        <span>{name}</span>
        <PenLine size={14} aria-hidden="true" />
      </button>
    </h1>
  );
};

const useFullscreen = () => {
  const supported = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const [active, setActive] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    if (!supported) return;
    const sync = () => setActive(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [supported]);
  const toggle = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    request?.catch(() => undefined);
  };
  return { supported, active, toggle };
};

export const Toolbar: React.FC<ToolbarProps> = ({
  saveState,
  onPreview,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRename,
  onOpenLayers,
  display,
  activePage,
  isSaving,
  handleSave,
  showLeftSidebar,
  setShowLeftSidebar,
  setShowRightSidebar,
  setShowLayersModal,
  showLayersModal,
  onGoHome,
}) => {
  const fullscreen = useFullscreen();
  const status = saveState ? describeSaveState(saveState) : null;
  // Com autosave o rascunho já se salva sozinho; o botão principal leva a cena para as TVs.
  const publishLabel = saveState ? 'Publicar' : 'Salvar';
  const PublishIcon = saveState ? Send : Save;

  const openLayers = () => {
    if (onOpenLayers) {
      onOpenLayers();
      return;
    }
    setShowLayersModal(!showLayersModal);
    setShowLeftSidebar(false);
    setShowRightSidebar(false);
  };

  const preview = () => {
    if (onPreview) {
      onPreview();
      return;
    }
    window.open(`${import.meta.env.BASE_URL}#/player/${display.slug || display.id}`, '_blank');
  };

  return (
    <header className="hub-toolbar hub-toolbar--grid z-30 shadow-card">
      <div className="hub-toolbar__left">
        <button type="button" aria-label="Voltar ao painel" title="Voltar ao painel" onClick={onGoHome} className="hub-home hub-toolbar__icon">
          <Home size={20} />
        </button>
        <div className="hub-brand">
          <span className="brand-lockup brand-lockup--white" role="img" aria-label="Tellas" />
        </div>
        {(onUndo || onRedo) && (
          <div className="hub-toolbar__history" role="group" aria-label="Histórico">
            <button type="button" className="hub-toolbar__icon" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!onUndo || !canUndo} onClick={onUndo}>
              <Undo2 size={18} />
            </button>
            <button type="button" className="hub-toolbar__icon" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)" disabled={!onRedo || !canRedo} onClick={onRedo}>
              <Redo2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="hub-toolbar__center">
        <DisplayName name={display.name} onRename={onRename} />
        {saveState && (
          <span className={`hub-save-chip is-${status?.tone ?? 'idle'}`} role="status" aria-live="polite" title={status?.title}>
            {status && (
              <>
                <status.Icon size={14} aria-hidden="true" className={status.tone === 'saving' ? 'animate-spin' : undefined} />
                <span>{status.label}</span>
              </>
            )}
          </span>
        )}
      </div>

      <div className="hub-toolbar__right">
        <button
          type="button"
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="hub-toolbar__icon hub-toolbar__widgets"
          aria-label="Widgets"
          aria-pressed={showLeftSidebar}
          title="Widgets"
        >
          <LayoutGrid size={18} />
        </button>

        <button
          type="button"
          onClick={openLayers}
          aria-expanded={showLayersModal}
          aria-controls="editor-layers"
          aria-label={`Camadas (${activePage.layout.length})`}
          className="hub-toolbar__btn"
          title="Camadas"
        >
          <Layers size={18} />
          <span className="hub-toolbar__label">Camadas</span>
        </button>

        <button type="button" onClick={preview} className="hub-toolbar__btn" aria-label="Visualizar" title="Ver como fica na TV">
          <Eye size={18} />
          <span className="hub-toolbar__label">Visualizar</span>
        </button>

        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="hub-toolbar__icon hub-toolbar__fullscreen"
            aria-label={fullscreen.active ? 'Sair da tela cheia' : 'Tela cheia'}
            aria-pressed={fullscreen.active}
            title={fullscreen.active ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {fullscreen.active ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        )}

        <button type="button" onClick={handleSave} disabled={isSaving} className="hub-primary-action hub-toolbar__btn">
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <PublishIcon size={18} />}
          <span>{isSaving ? (saveState ? 'Publicando…' : 'Salvando…') : publishLabel}</span>
        </button>
      </div>
    </header>
  );
};
