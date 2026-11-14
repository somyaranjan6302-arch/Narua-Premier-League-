const MAX_CUTOUT_BYTES = 8 * 1024 * 1024;
const MAX_CUTOUT_DIMENSION = 1024;
const WEBP_QUALITIES = [0.9, 0.82, 0.72, 0.62, 0.52];

const decodePhotoData = (photoData) => {
  const match = typeof photoData === 'string'
    ? photoData.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/)
    : null;
  if (!match) throw new Error('The original player photo is unavailable in this registration session.');

  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: match[1] });
};

const canvasBlob = (canvas, type, quality) => new Promise((resolve) => {
  canvas.toBlob(resolve, type, quality);
});

const hasAlphaPixels = (imageData) => {
  for (let offset = 3; offset < imageData.length; offset += 4) {
    if (imageData[offset] < 255) return true;
  }
  return false;
};

export const optimizeAuctionCutout = async (sourceBlob, { requireTransparency = false } = {}) => {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser cannot prepare transparent player images. Try a current desktop or mobile browser.');
  }

  const image = await createImageBitmap(sourceBlob);
  const canvas = document.createElement('canvas');
  try {
    let scale = Math.min(1, MAX_CUTOUT_DIMENSION / Math.max(image.width, image.height));
    while (true) {
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d', { willReadFrequently: requireTransparency });
      if (!context) throw new Error('This browser could not prepare the transparent player cutout.');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      if (requireTransparency && !hasAlphaPixels(context.getImageData(0, 0, canvas.width, canvas.height).data)) {
        throw new Error('Choose a PNG or WebP that already has a transparent background.');
      }

      for (const quality of WEBP_QUALITIES) {
        const webp = await canvasBlob(canvas, 'image/webp', quality);
        if (webp?.type !== 'image/webp') break;
        if (webp.size <= MAX_CUTOUT_BYTES) return webp;
      }

      const png = await canvasBlob(canvas, 'image/png');
      if (png?.type === 'image/png' && png.size <= MAX_CUTOUT_BYTES) return png;
      if (Math.max(canvas.width, canvas.height) <= 384) {
        throw new Error('The processed cutout is too large to upload. Try a smaller transparent image.');
      }
      scale *= 0.8;
    }
  } finally {
    image.close();
    canvas.width = 0;
    canvas.height = 0;
  }
};

export const createAuctionPlayerCutout = async (photoData, onProgress) => {
  const photo = decodePhotoData(photoData);
  const { removeBackground } = await import('@bg0/browser');
  const result = await removeBackground(photo, {
    quality: 'fast',
    onProgress
  });
  return optimizeAuctionCutout(result.blob);
};

export const prepareManualAuctionCutout = async (file) => {
  if (!(file instanceof Blob) || !['image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a transparent PNG or WebP cutout.');
  }
  if (file.size > 40 * 1024 * 1024) {
    throw new Error('Choose a transparent cutout smaller than 40 MB.');
  }
  return optimizeAuctionCutout(file, { requireTransparency: true });
};
