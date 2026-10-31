# packages/marca

Identidade "Vitrine Acesa" do TelaHub, compartilhada por `apps/site`, `apps/painel` e `apps/checkout`.

| Arquivo | Uso |
|---|---|
| `tokens.css` | Variáveis CSS de cor, fonte, raio e sombra. Importar uma vez na entrada CSS de cada app. |
| `tailwind-theme.css` | Ponte para o Tailwind v4 (`@theme inline`). Só painel e checkout. |
| `logo.svg` | Logo oficial: grade de telas ligadas a um centro. Mantido para compatibilidade; a interface usa agora o símbolo original enviado pelo usuário. |
| `favicon.svg` | Favicon dos três apps. |

Não é pacote npm: os apps importam por caminho relativo (`../../packages/marca/tokens.css`). Por isso o build Docker de cada app usa contexto na raiz do monorepo e cada `vite.config` libera a raiz em `server.fs.allow`.

Regra: app nenhum escreve hex solto. Faltou um tom, ele entra em `tokens.css` primeiro, com o contraste medido no comentário do cabeçalho.


## Referências Telas — 22/10/2026

O azul original de `tokens.css` foi preservado. A revisão se restringe à arte,
ícones e backgrounds, sem alterar tipografia, grid, textos comerciais ou fluxos.

- `assets/simbolo-original.png`: cópia intacta de `LOGO TELAS HUB-02.png` enviada pelo usuário. `visual-assets.css` mostra somente o símbolo em T por enquadramento CSS, preservando os pixels originais.
- `assets/diagonais-azuis.jpg`: background criado com a ferramenta integrada de geração de imagens, usando as referências 07 e 05. Importado pelo CSS compartilhado; não depende de Downloads nem da pasta do Codex.
- Landing e painel importam `visual-assets.css` por suas folhas `identity.css`.
- O fundo pontilhado do editor pertence à área de trabalho; não é aplicado à cena publicada.

Prompt do background: Create a premium abstract website background inspired by the attached Telas brand references. Wide landscape. No text, lettering, logos or UI. Architectural diagonal ribbon forms echo the diagonal cut of the T symbol, translucent frosted blue acrylic planes, royal blue transitioning into cyan along the far right and lower right edges. Left 60 percent clean off-white with subtle cool blue haze for headline overlay. Restrained corporate art direction, spacious negative space, no purple, orange, green, busy particles or grid.

## Exemplos de aplicação - 22/10/2026

As imagens foram geradas com a ferramenta integrada image_gen e comprimidas em
JPEG. São aplicações ilustrativas, não fotos de clientes. Os prompts completos
estão em [assets/PROMPTS-EXEMPLOS.md](assets/PROMPTS-EXEMPLOS.md).

- Abertura: arte-cafe, arte-moda e hero-*. Seis artes exclusivas.
- Segmentos: uso-padaria, uso-loja, uso-mercado, uso-shopping-v2 e ambiente-*.
  Quatro estabelecimentos e quatro campanhas exclusivas, projetadas por CSS
  dentro das molduras das fotos. A aplicação de shopping foi refeita.
- Formatos: widgets HTML/CSS de clima e indicadores, com dados ilustrativos,
  em 16:9 e 9:16. Opções permitem fixar Clima, Indicadores ou alternar.
- Todas as seções têm backgrounds diferentes; somente a abertura usa a imagem
  diagonais-azuis.jpg. As demais usam composições CSS na identidade azul.

ScreenPlaylist e WorldScreen alternam a cada 3000 ms, com fade de opacidade.
A reprodução pausa fora da área visível, com a aba oculta, pela opção de pausa
ou pela preferência de movimento reduzido. O fluxo de publicação não é afetado.

JPEGs da landing: apps/site/public/exemplos/. O painel possui cópias independentes
de arte-cafe e arte-moda em apps/painel/public/exemplos/. As sugestões do painel
são identificadas como exemplos. No editor vazio, só a ação “Usar imagem de exemplo”
altera o rascunho; publicar continua dependendo de salvar.
