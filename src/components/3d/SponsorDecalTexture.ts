import * as THREE from 'three';
import type { Sponsor } from '../../types/sponsor';

const textureCache = new Map<string, THREE.CanvasTexture>();
const imageCache = new Map<string, HTMLImageElement>();

export const createSponsorTexture = (
  sponsor: Partial<Sponsor>,
  _isHovered = false,
  _isFocused = false
): THREE.CanvasTexture => {
  const cacheKey = `${sponsor.id || 'draft'}_${sponsor.brandName}_${sponsor.logoUrl}_${sponsor.flipX}_${sponsor.flipY}_${sponsor.filterStyle}_${sponsor.opacity}_${sponsor.widthCm}_${sponsor.heightCm}`;

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  // Square High-Resolution 1024x1024 Canvas for Ultra-Crisp Decals
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);

  const drawContent = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 1024);

    const hasLogo = !!sponsor.logoUrl;
    const logoImg = sponsor.logoUrl ? imageCache.get(sponsor.logoUrl) : null;

    if (hasLogo && logoImg && (logoImg.complete || logoImg.naturalWidth > 0)) {
      try {
        const natW = logoImg.naturalWidth || logoImg.width || 512;
        const natH = logoImg.naturalHeight || logoImg.height || 512;
        const aspect = natW / natH;

        let drawW = 1024;
        let drawH = 1024 / aspect;

        if (drawH > 1024) {
          drawH = 1024;
          drawW = 1024 * aspect;
        }

        const imgX = (1024 - drawW) / 2;
        const imgY = (1024 - drawH) / 2;

        ctx.save();
        ctx.globalAlpha = sponsor.opacity ?? 1.0;

        // Apply Horizontal and Vertical Mirroring (Flip)
        ctx.translate(512, 512);
        ctx.scale(sponsor.flipX ? -1 : 1, sponsor.flipY ? -1 : 1);
        ctx.translate(-512, -512);

        if (sponsor.filterStyle === 'white') {
          // Draw monochrome pure white vinyl logo
          ctx.drawImage(logoImg, imgX, imgY, drawW, drawH);
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 1024, 1024);
        } else if (sponsor.filterStyle === 'black') {
          // Draw monochrome pitch black vinyl logo
          ctx.drawImage(logoImg, imgX, imgY, drawW, drawH);
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 1024, 1024);
        } else {
          // Full-color original logo
          ctx.drawImage(logoImg, imgX, imgY, drawW, drawH);
        }

        ctx.restore();
      } catch (err) {
        console.warn('Error drawing pure logo decal on canvas', err);
      }
    } else {
      // Clean, elegant default text placeholder when no logo is uploaded yet
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(128, 384, 768, 256, 32);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = (sponsor.sponsorName || sponsor.brandName || 'SUBE TU LOGO').toUpperCase();
      ctx.fillText(name.length > 15 ? name.substring(0, 15) + '...' : name, 512, 512);
    }

    texture.needsUpdate = true;
  };

  if (sponsor.logoUrl) {
    if (!imageCache.has(sponsor.logoUrl)) {
      const img = new Image();
      if (sponsor.logoUrl.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        imageCache.set(sponsor.logoUrl!, img);
        drawContent();
      };
      img.onerror = () => {
        console.warn('Failed to load logo image:', sponsor.logoUrl);
      };
      img.src = sponsor.logoUrl;
    } else {
      drawContent();
    }
  } else {
    drawContent();
  }

  return texture;
};
