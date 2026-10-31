import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, FolderOpen, Link2, Plus, Upload, X } from 'lucide-react';
import { WidgetType, type LayoutItem } from '../../types';
import { catalogAsset, widgetCatalog, withCatalogLink, type WidgetPreset } from './widgetCatalogData';
import './WidgetCatalog.css';

interface WidgetCatalogProps {
  type: WidgetType;
  onBack: () => void;
  onClose: () => void;
  addWidget: (type: WidgetType, data?: Partial<LayoutItem['data']>) => void;
  setMediaLibraryConfig: React.Dispatch<React.SetStateAction<any>>;
}

export function WidgetCatalog({ type, onBack, onClose, addWidget, setMediaLibraryConfig }: WidgetCatalogProps) {
  const category = widgetCatalog[type];
  const [selectedPreset, setSelectedPreset] = useState<WidgetPreset | null>(null);
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const linkRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, [type]);

  const add = (data: Partial<LayoutItem['data']>) => {
    addWidget(type, data);
    setError('');
    setMessage('Adicionado à tela. Você pode editar o bloco ou adicionar outro.');
  };

  const openMedia = () => {
    const data = selectedPreset?.data() || category.blank;
    setMediaLibraryConfig({
      isOpen: true,
      allowedTypes: category.media,
      onSelect: (url: string) => add(withCatalogLink(type, data, url)),
    });
  };

  const selectPreset = (preset: WidgetPreset) => {
    setSelectedPreset(preset);
    setMessage('');
    setError('');
    if (category.requiresLink) {
      setMessage(`${preset.title} selecionado. ${category.media ? 'Escolha um arquivo ou informe o link.' : 'Informe o link para adicionar à tela.'}`);
      linkRef.current?.focus();
    } else {
      add(preset.data());
    }
  };

  const addFromLink = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = link.trim();
    try {
      const parsed = new URL(clean);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
    } catch {
      setError('Informe um endereço completo que comece com https:// ou http://.');
      linkRef.current?.focus();
      return;
    }
    add(withCatalogLink(type, selectedPreset?.data() || category.blank, clean));
  };

  return (
    <section className="hub-widget-catalog" aria-labelledby="widget-catalog-title">
      <div className="hub-catalog-navigation">
        <button type="button" onClick={onBack} className="hub-catalog-back"><ArrowLeft size={15} /> Todos os widgets</button>
        <button type="button" onClick={onClose} className="hub-catalog-close md:hidden" aria-label="Fechar biblioteca de widgets"><X size={17} /></button>
      </div>

      <div className="hub-catalog-heading">
        <img src={catalogAsset(`icons3d/${category.icon}.png`)} alt="" width="48" height="48" />
        <div><span className="hub-catalog-eyebrow">Biblioteca</span><h3 id="widget-catalog-title" ref={titleRef} tabIndex={-1}>{category.title}</h3></div>
      </div>
      <p className="hub-catalog-description">{category.description}</p>

      {category.media && (
        <div className="hub-catalog-media-actions">
          <button type="button" className="hub-catalog-upload" onClick={openMedia}>
            <Upload size={18} /><span><strong>Adicionar {category.media === 'video' ? 'vídeo' : type === WidgetType.GIF ? 'GIF' : 'imagem'}</strong><small>Envie um arquivo do seu dispositivo</small></span><Plus size={15} />
          </button>
          <button type="button" className="hub-catalog-library" onClick={openMedia}><FolderOpen size={16} /> Escolher da minha biblioteca <ChevronRight size={14} /></button>
        </div>
      )}

      <button type="button" className="hub-catalog-blank" onClick={() => add(category.blank)}><Plus size={16} /> {category.requiresLink ? 'Configurar um bloco do zero' : 'Adicionar um bloco novo'}</button>

      <div className="hub-catalog-section-title"><h4>{category.requiresLink ? 'Como você quer exibir?' : 'Comece com um modelo'}</h4><span>{category.presets.length}</span></div>
      <div className="hub-catalog-presets">
        {category.presets.map(preset => (
          <button key={preset.id} type="button" className={`hub-catalog-preset ${selectedPreset?.id === preset.id ? 'is-selected' : ''}`} onClick={() => selectPreset(preset)} aria-pressed={selectedPreset?.id === preset.id}>
            <span className={`hub-catalog-preview hub-catalog-preview--${preset.tone || 'blue'} ${preset.image ? 'has-image' : ''}`}>
              {preset.image ? <img src={preset.image} alt="" loading="lazy" /> : <span>{preset.sample}</span>}
              {selectedPreset?.id === preset.id && <i><Check size={12} /></i>}
            </span>
            <span className="hub-catalog-preset-copy"><strong>{preset.title}</strong><small>{preset.description}</small></span>
            <Plus className="hub-catalog-preset-add" size={15} />
          </button>
        ))}
      </div>

      {category.linkLabel && (
        <form className="hub-catalog-link-form" onSubmit={addFromLink} noValidate>
          <label htmlFor="widget-catalog-link"><Link2 size={13} /> {category.linkLabel}</label>
          <input ref={linkRef} id="widget-catalog-link" type="url" placeholder={category.linkPlaceholder} value={link} onChange={event => { setLink(event.target.value); setError(''); }} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? 'widget-catalog-error' : category.linkHelp ? 'widget-catalog-help' : undefined} />
          {category.linkHelp && <p id="widget-catalog-help">{category.linkHelp}</p>}
          {error && <p id="widget-catalog-error" className="hub-catalog-error" role="alert">{error}</p>}
          <button type="submit"><Plus size={15} /> Adicionar à tela</button>
        </form>
      )}

      <div className="hub-catalog-status" role="status" aria-live="polite">{message && <><Check size={15} /><span>{message}</span></>}</div>
      <p className="hub-catalog-footnote">Os modelos são um ponto de partida. Selecione o bloco na TV para personalizar.</p>
    </section>
  );
}
