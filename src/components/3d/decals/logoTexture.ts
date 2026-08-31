import * as THREE from 'three';
import type { Polygon } from '../../../utils/overlapDetection';

/**
 * A canvas backed texture for one sticker.
 *
 * One instance owns exactly one canvas and one `CanvasTexture` for its whole life:
 * changing size, logo, opacity or cut-outs repaints the existing canvas instead of
 * allocating a new one. That matters because the studio repaints on every pointer
 * move while dragging a logo across the body.
 */

export type LogoFilterStyle = 'original' | 'white' | 'black';

export interface LogoAppearance {
  logoUrl?: string;
  /** Fallback text drawn when there is no logo image yet. */
  label?: string;
  widthCm: number;
  heightCm: number;
  flipX?: boolean;
  flipY?: boolean;
  filterStyle?: LogoFilterStyle;
  opacity?: number;
  /** Areas already sold to other sponsors, in `overlapDetection` texture space (0..1024). */
  cutouts?: Polygon[];
}

/** `overlapDetection` emits polygons on a fixed 1024 grid. */
const MASK_SPACE = 1024;

/** Longest canvas edge. Keeps small stickers cheap and big ones crisp. */
const MAX_TEXTURE_EDGE = 1024;
const MIN_TEXTURE_EDGE = 128;

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export const loadLogoImage = (url: string): Promise<HTMLImageElement | null> => {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const pending = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    if (/^https?:/i.test(url)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.warn('No se pudo cargar el logotipo:', url);
      resolve(null);
    };
    image.src = url;
  });

  imageCache.set(url, pending);
  return pending;
};

const appearanceKey = (appearance: LogoAppearance): string =>
  [
    appearance.logoUrl || '',
    appearance.label || '',
    appearance.widthCm,
    appearance.heightCm,
    appearance.flipX ? 1 : 0,
    appearance.flipY ? 1 : 0,
    appearance.filterStyle || 'original',
    appearance.opacity ?? 1,
    (appearance.cutouts || [])
      .map((polygon) => polygon.map((p) => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(' '))
      .join(';'),
  ].join('|');

export class LogoTexture {
  readonly texture: THREE.CanvasTexture;

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private appearance: LogoAppearance = { widthCm: 35, heightCm: 20 };
  private lastKey = '';
  private image: HTMLImageElement | null = null;
  private imageUrl = '';
  private disposed = false;

  /** Fired when an async logo finishes loading and the canvas was repainted. */
  onRepaint?: () => void;

  constructor(onRepaint?: () => void) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = MAX_TEXTURE_EDGE;
    this.canvas.height = MAX_TEXTURE_EDGE;
    this.ctx = this.canvas.getContext('2d');
    this.onRepaint = onRepaint;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = true;
  }

  /** Repaints only when something actually changed. */
  apply(appearance: LogoAppearance): void {
    if (this.disposed) return;

    const key = appearanceKey(appearance);
    const urlChanged = (appearance.logoUrl || '') !== this.imageUrl;
    if (key === this.lastKey && !urlChanged) return;

    this.lastKey = key;
    this.appearance = appearance;

    if (urlChanged) {
      this.imageUrl = appearance.logoUrl || '';
      this.image = null;

      if (this.imageUrl) {
        const requestedUrl = this.imageUrl;
        void loadLogoImage(requestedUrl).then((image) => {
          // A newer logo may have been picked while this one was loading.
          if (this.disposed || requestedUrl !== this.imageUrl) return;
          this.image = image;
          this.paint();
          this.onRepaint?.();
        });
      }
    }

    this.paint();
  }

  dispose(): void {
    this.disposed = true;
    this.texture.dispose();
  }

  /**
   * The canvas keeps the sticker's real aspect ratio so the decal projection never
   * stretches the artwork.
   */
  private resizeCanvas(): { width: number; height: number } {
    const widthCm = Math.max(1, this.appearance.widthCm || 35);
    const heightCm = Math.max(1, this.appearance.heightCm || 20);
    const aspect = widthCm / heightCm;

    let width = MAX_TEXTURE_EDGE;
    let height = Math.round(MAX_TEXTURE_EDGE / aspect);

    if (aspect < 1) {
      height = MAX_TEXTURE_EDGE;
      width = Math.round(MAX_TEXTURE_EDGE * aspect);
    }

    width = THREE.MathUtils.clamp(width, MIN_TEXTURE_EDGE, MAX_TEXTURE_EDGE);
    height = THREE.MathUtils.clamp(height, MIN_TEXTURE_EDGE, MAX_TEXTURE_EDGE);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    return { width, height };
  }

  private paint(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const { width, height } = this.resizeCanvas();
    ctx.clearRect(0, 0, width, height);

    if (this.image) {
      this.paintImage(ctx, width, height);
    } else {
      this.paintPlaceholder(ctx, width, height);
    }

    this.paintCutouts(ctx, width, height);
    this.texture.needsUpdate = true;
  }

  private paintImage(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const image = this.image!;
    const naturalWidth = image.naturalWidth || image.width || 1;
    const naturalHeight = image.naturalHeight || image.height || 1;

    // Contain-fit: the artwork keeps its own proportions inside the sticker.
    const scale = Math.min(width / naturalWidth, height / naturalHeight);
    const drawWidth = naturalWidth * scale;
    const drawHeight = naturalHeight * scale;

    ctx.save();
    ctx.globalAlpha = this.appearance.opacity ?? 1;

    ctx.translate(width / 2, height / 2);
    ctx.scale(this.appearance.flipX ? -1 : 1, this.appearance.flipY ? -1 : 1);
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const filterStyle = this.appearance.filterStyle;
    if (filterStyle === 'white' || filterStyle === 'black') {
      ctx.save();
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = filterStyle === 'white' ? '#ffffff' : '#0f172a';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  private paintPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const label = (this.appearance.label || 'TU LOGO').toUpperCase();
    const radius = Math.min(width, height) * 0.12;
    const inset = Math.min(width, height) * 0.06;

    ctx.save();
    ctx.globalAlpha = this.appearance.opacity ?? 1;

    ctx.fillStyle = 'rgba(12, 15, 22, 0.88)';
    ctx.beginPath();
    ctx.roundRect(inset, inset, width - inset * 2, height - inset * 2, radius);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(3, Math.min(width, height) * 0.03);
    ctx.stroke();

    const text = label.length > 18 ? `${label.slice(0, 18)}…` : label;
    let fontSize = Math.min(height * 0.34, (width * 1.6) / Math.max(6, text.length));
    fontSize = Math.max(12, fontSize);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillText(text, width / 2, height / 2);
    ctx.restore();
  }

  /** Punches out the cells already owned by other sponsors. */
  private paintCutouts(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const cutouts = this.appearance.cutouts;
    if (!cutouts || cutouts.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';

    cutouts.forEach((polygon) => {
      if (polygon.length < 3) return;
      ctx.beginPath();
      polygon.forEach((point, index) => {
        const x = (point.x / MASK_SPACE) * width;
        const y = (point.y / MASK_SPACE) * height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }
}
