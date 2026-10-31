export interface CanvasGeometry {
  width: number;
  height: number;
  cols: number;
  rows: number;
  cellSize: number;
  /** Videowall: TVs lado a lado e uma acima da outra (1×1 = tela comum). */
  wallCols: number;
  wallRows: number;
  /** Tamanho de uma TV em pixels e em células da grade. */
  tileWidth: number;
  tileHeight: number;
  tileCols: number;
  tileRows: number;
}

export interface WallSpec { cols: number; rows: number }

/** Limites do videowall aceitos pelo editor e pela API. */
export const WALL_MAX = 6;

export function normalizeWall(wall?: WallSpec | null): WallSpec {
  const clamp = (n: unknown) => Math.max(1, Math.min(WALL_MAX, Math.round(Number(n) || 1)));
  return { cols: clamp(wall?.cols), rows: clamp(wall?.rows) };
}

export function isWall(wall?: WallSpec | null): boolean {
  const w = normalizeWall(wall);
  return w.cols * w.rows > 1;
}

/**
 * A mesma grade 48 × 27 / 27 × 48 do Player, por TV. No videowall a grade é
 * a soma das TVs: 3 TVs horizontais empilhadas = 48 × 81 células.
 */
export function getCanvasGeometry(orientation?: string, wall?: WallSpec | null): CanvasGeometry {
  const vertical = orientation === 'vertical';
  const { cols: wallCols, rows: wallRows } = normalizeWall(wall);
  const tileCols = vertical ? 27 : 48;
  const tileRows = vertical ? 48 : 27;
  const cellSize = 40;
  return {
    width: tileCols * cellSize * wallCols,
    height: tileRows * cellSize * wallRows,
    cols: tileCols * wallCols,
    rows: tileRows * wallRows,
    cellSize,
    wallCols,
    wallRows,
    tileWidth: tileCols * cellSize,
    tileHeight: tileRows * cellSize,
    tileCols,
    tileRows,
  };
}

/** Account for the physical bezel, without distorting the picture inside it. */
export function fitCanvasScale(width: number, height: number, geometry: CanvasGeometry): number {
  return Math.max(0, Math.min(1, (width - 10) / geometry.width, (height - 16) / geometry.height));
}

export interface CanvasGridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Apply bounds only after a deliberate drag/resize; never migrate stored scenes. */
export function boundCanvasItem(item: CanvasGridItem, geometry: CanvasGeometry): CanvasGridItem {
  const w = Math.max(1, Math.min(geometry.cols, Math.round(item.w)));
  const h = Math.max(1, Math.min(geometry.rows, Math.round(item.h)));
  return {
    i: item.i,
    w,
    h,
    x: Math.max(0, Math.min(geometry.cols - w, Math.round(item.x))),
    y: Math.max(0, Math.min(geometry.rows - h, Math.round(item.y))),
  };
}

/** Linhas de divisão entre TVs, em células da grade (x verticais, y horizontais). */
export function getWallSeams(geometry: CanvasGeometry): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  for (let c = 1; c < geometry.wallCols; c++) x.push(c * geometry.tileCols);
  for (let r = 1; r < geometry.wallRows; r++) y.push(r * geometry.tileRows);
  return { x, y };
}

/** Elemento atravessado por uma divisão entre TVs (o corte fica na moldura). */
export function crossesWallSeam(item: CanvasGridItem, geometry: CanvasGeometry): boolean {
  const seams = getWallSeams(geometry);
  return seams.x.some(s => item.x < s && item.x + item.w > s) || seams.y.some(s => item.y < s && item.y + item.h > s);
}
