import * as THREE from 'three';
import type { Sponsor } from '../../types/sponsor';

const textureCache = new Map<string, THREE.CanvasTexture>();
const imageCache = new Map<string, HTMLImageElement>();

export const createSponsorTexture = (
  sponsor: Partial<Sponsor>,
  isHovered = false,
  isFocused = false
): THREE.CanvasTexture => {
  const cacheKey = `${sponsor.id || 'draft'}_${sponsor.brandName}_${sponsor.logoUrl}_${sponsor.stickerBgColor}_${sponsor.stickerBorderColor}_${sponsor.logoScale}_${isHovered}_${isFocused}_${sponsor.tier}_${sponsor.widthCm}_${sponsor.heightCm}`;

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  // High-Resolution 1024x512 Canvas for Ultra-Crisp Decals
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
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
    ctx.clearRect(0, 0, 1024, 512);

    const bgColor = sponsor.stickerBgColor || '#0a0c10';
    const borderColor = sponsor.stickerBorderColor || (isFocused ? '#ffffff' : isHovered ? '#e2e8f0' : 'rgba(255, 255, 255, 0.35)');
    const textColor = sponsor.stickerTextColor || '#ffffff';

    // Rounded Vinyl Badge
    const radius = 48;
    ctx.beginPath();
    ctx.roundRect(16, 16, 992, 480, radius);

    // Background Fill
    if (bgColor === 'transparent') {
      ctx.fillStyle = isFocused ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.45)';
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fill();

    // Fine Border
    if (borderColor !== 'transparent') {
      ctx.lineWidth = isFocused ? 10 : isHovered ? 8 : 4;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }

    const hasLogo = !!sponsor.logoUrl;
    const logoImg = sponsor.logoUrl ? imageCache.get(sponsor.logoUrl) : null;

    if (hasLogo && logoImg && logoImg.complete) {
      try {
        const imgScale = sponsor.logoScale || 1;
        const maxImgWidth = 280 * imgScale;
        const maxImgHeight = 280 * imgScale;

        const aspect = (logoImg.naturalWidth || logoImg.width || 1) / (logoImg.naturalHeight || logoImg.height || 1);
        let drawW = maxImgWidth;
        let drawH = maxImgWidth / aspect;
        if (drawH > maxImgHeight) {
          drawH = maxImgHeight;
          drawW = maxImgHeight * aspect;
        }

        const imgX = 64 + (maxImgWidth - drawW) / 2;
        const imgY = (512 - drawH) / 2;

        ctx.drawImage(logoImg, imgX, imgY, drawW, drawH);

        // Header Tag
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 24px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${sponsor.areaCm2 || 100} cm² · 5 AÑOS PORSCHE 911`, 380, 130);

        // Brand Name
        ctx.fillStyle = textColor;
        ctx.font = 'bold 56px "Plus Jakarta Sans", system-ui, sans-serif';
        const name = (sponsor.brandName || 'TU MARCA').toUpperCase();
        ctx.fillText(name.length > 15 ? name.substring(0, 15) + '...' : name, 380, 210);

        // Slogan
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
        const slogan = sponsor.slogan || 'Patrocinador Oficial';
        ctx.fillText(slogan.length > 28 ? slogan.substring(0, 28) + '...' : slogan, 380, 280);

        // URL Link
        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 26px "JetBrains Mono", monospace';
        const url = (sponsor.targetUrl || 'buymeaporsche.com').replace(/^https?:\/\//, '');
        ctx.fillText(`↗ ${url.length > 25 ? url.substring(0, 25) + '...' : url}`, 380, 350);

      } catch (err) {
        console.warn('Error drawing decal on canvas', err);
      }
    } else {
      // Header Tag
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 28px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${sponsor.areaCm2 || 100} cm² · 5 AÑOS PORSCHE 911`, 64, 96);

      // Brand Name
      ctx.fillStyle = textColor;
      ctx.font = 'bold 72px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      const name = (sponsor.brandName || 'TU MARCA').toUpperCase();
      ctx.fillText(name.length > 18 ? name.substring(0, 18) + '...' : name, 512, 230);

      // Slogan
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 34px "Plus Jakarta Sans", sans-serif';
      const slogan = sponsor.slogan || 'Patrocinador Oficial Porsche 911 (992)';
      ctx.fillText(slogan.length > 36 ? slogan.substring(0, 36) + '...' : slogan, 512, 310);

      // URL
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 28px "JetBrains Mono", monospace';
      const url = (sponsor.targetUrl || 'buymeaporsche.com').replace(/^https?:\/\//, '');
      ctx.fillText(`↗ ${url}`, 512, 390);
    }

    texture.needsUpdate = true;
  };

  if (sponsor.logoUrl && !imageCache.has(sponsor.logoUrl)) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(sponsor.logoUrl!, img);
      drawContent();
    };
    img.src = sponsor.logoUrl;
  }

  drawContent();
  return texture;
};
