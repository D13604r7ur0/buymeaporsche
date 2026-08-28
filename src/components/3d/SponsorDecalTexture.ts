import * as THREE from 'three';
import type { Sponsor } from '../../types/sponsor';

const textureCache = new Map<string, THREE.CanvasTexture>();
const imageCache = new Map<string, HTMLImageElement>();

export const createSponsorTexture = (
  sponsor: Partial<Sponsor>,
  isHovered = false,
  isFocused = false
): THREE.CanvasTexture => {
  const cacheKey = `${sponsor.id || 'draft'}_${sponsor.brandName}_${sponsor.logoUrl}_${sponsor.stickerBgColor}_${sponsor.stickerBorderColor}_${sponsor.stickerFont}_${isHovered}_${isFocused}_${sponsor.tier}_${sponsor.widthCm}_${sponsor.heightCm}`;

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);

  const drawContent = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, 512, 256);

    const bgColor = sponsor.stickerBgColor || '#0a0c10';
    const borderColor = sponsor.stickerBorderColor || (isFocused ? '#ffffff' : isHovered ? '#e2e8f0' : 'rgba(255, 255, 255, 0.25)');
    const textColor = sponsor.stickerTextColor || '#ffffff';

    // Draw sticker shape
    const radius = 24;
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 236, radius);

    // Background
    if (bgColor === 'transparent') {
      ctx.fillStyle = isFocused ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)';
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fill();

    // Border
    if (borderColor !== 'transparent') {
      ctx.lineWidth = isFocused ? 6 : isHovered ? 4 : 2;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }

    const hasLogo = !!sponsor.logoUrl;
    const logoImg = sponsor.logoUrl ? imageCache.get(sponsor.logoUrl) : null;

    if (hasLogo && logoImg && logoImg.complete) {
      // Layout with Image
      try {
        const imgScale = sponsor.logoScale || 1;
        const maxImgWidth = 140 * imgScale;
        const maxImgHeight = 140 * imgScale;
        
        const aspect = (logoImg.width || 1) / (logoImg.height || 1);
        let drawW = maxImgWidth;
        let drawH = maxImgWidth / aspect;
        if (drawH > maxImgHeight) {
          drawH = maxImgHeight;
          drawW = maxImgHeight * aspect;
        }

        const imgX = 35 + (maxImgWidth - drawW) / 2;
        const imgY = (256 - drawH) / 2;

        ctx.drawImage(logoImg, imgX, imgY, drawW, drawH);

        // Text beside the image
        ctx.fillStyle = textColor;
        ctx.font = 'bold 32px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'left';
        const name = (sponsor.brandName || 'TU MARCA').toUpperCase();
        ctx.fillText(name.length > 14 ? name.substring(0, 14) + '...' : name, 195, 110);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        const slogan = sponsor.slogan || 'Patrocinador Oficial';
        ctx.fillText(slogan.length > 24 ? slogan.substring(0, 24) + '...' : slogan, 195, 148);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 14px "JetBrains Mono", monospace';
        const url = (sponsor.targetUrl || 'buymeaporsche.com').replace(/^https?:\/\//, '');
        ctx.fillText(`↗ ${url.length > 22 ? url.substring(0, 22) + '...' : url}`, 195, 182);

        // Top tag
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText(`${sponsor.areaCm2 || 100} cm² · 5 AÑOS`, 195, 68);

      } catch (err) {
        console.warn('Error drawing sticker logo image on canvas', err);
      }
    } else {
      // Text-centric layout
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${sponsor.areaCm2 || 100} cm² · 5 AÑOS PORSCHE 911`, 34, 48);

      // Brand Name
      ctx.fillStyle = textColor;
      ctx.font = 'bold 40px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      const name = (sponsor.brandName || 'TU MARCA').toUpperCase();
      ctx.fillText(name.length > 18 ? name.substring(0, 18) + '...' : name, 256, 122);

      // Slogan
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      const slogan = sponsor.slogan || 'Patrocinador Oficial 911 (992)';
      ctx.fillText(slogan.length > 34 ? slogan.substring(0, 34) + '...' : slogan, 256, 168);

      // Target URL
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 15px "JetBrains Mono", monospace';
      const url = (sponsor.targetUrl || 'buymeaporsche.com').replace(/^https?:\/\//, '');
      ctx.fillText(`↗ ${url}`, 256, 210);
    }

    texture.needsUpdate = true;
  };

  // Pre-load image if needed
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
