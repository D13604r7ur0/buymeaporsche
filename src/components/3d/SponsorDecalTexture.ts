import * as THREE from 'three';
import type { Sponsor } from '../../types/sponsor';

const textureCache = new Map<string, THREE.CanvasTexture>();
const imageCache = new Map<string, HTMLImageElement>();

export const createSponsorTexture = (
  sponsor: Partial<Sponsor>,
  isHovered = false,
  isFocused = false
): THREE.CanvasTexture => {
  const cacheKey = `${sponsor.id || 'draft'}_${sponsor.brandName}_${sponsor.logoUrl}_${sponsor.stickerBgColor}_${sponsor.stickerBorderColor}_${isHovered}_${isFocused}_${sponsor.widthCm}_${sponsor.heightCm}`;

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  // Square High-Resolution 1024x1024 Canvas for Maximum Sharpness
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

        let drawW = 960;
        let drawH = 960 / aspect;

        if (drawH > 960) {
          drawH = 960;
          drawW = 960 * aspect;
        }

        const imgX = (1024 - drawW) / 2;
        const imgY = (1024 - drawH) / 2;

        // Optional Background Color (if user picked one other than transparent)
        if (sponsor.stickerBgColor && sponsor.stickerBgColor !== 'transparent') {
          ctx.fillStyle = sponsor.stickerBgColor;
          ctx.beginPath();
          ctx.roundRect(imgX - 16, imgY - 16, drawW + 32, drawH + 32, 24);
          ctx.fill();
        }

        // Render ONLY the pure uploaded image/logo cleanly
        ctx.save();
        ctx.drawImage(logoImg, imgX, imgY, drawW, drawH);
        ctx.restore();

        // Optional Glowing Selection Outline if hovered/focused
        if (isFocused || isHovered) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 14;
          ctx.setLineDash([20, 12]);
          ctx.strokeRect(imgX - 10, imgY - 10, drawW + 20, drawH + 20);
        }
      } catch (err) {
        console.warn('Error drawing pure logo decal on canvas', err);
      }
    } else {
      // Fallback Typography ONLY if no image is uploaded yet
      const bgColor = sponsor.stickerBgColor && sponsor.stickerBgColor !== 'transparent' ? sponsor.stickerBgColor : 'rgba(0, 0, 0, 0.7)';
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(64, 256, 896, 512, 48);
      ctx.fill();

      ctx.strokeStyle = isFocused ? '#38bdf8' : '#ffffff';
      ctx.lineWidth = 12;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = (sponsor.sponsorName || sponsor.brandName || 'SUBE TU LOGO').toUpperCase();
      ctx.fillText(name.length > 14 ? name.substring(0, 14) + '...' : name, 512, 512);
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
