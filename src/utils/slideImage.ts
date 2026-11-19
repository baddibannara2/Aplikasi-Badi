import defaultWelcomeImg from '../assets/images/slide_welcome_nilai100_1795095314482.jpg';
import { DEFAULT_SLIDE_IMAGE_KEY } from '../data/defaultSlides';

// Safe Firestore document budget for an individual slide image Data URL (~450 KB text)
const MAX_SYNC_DATA_URL_LENGTH = 450000;

export function resolveSlideImageUrl(imageUrl?: string): string {
  if (!imageUrl) return '';
  const trimmed = imageUrl.trim();
  if (
    trimmed === DEFAULT_SLIDE_IMAGE_KEY ||
    trimmed === '/src/assets/images/slide_welcome_tka_1795045830208.jpg' ||
    trimmed === '/src/assets/images/slide_welcome_nilai100_1795095314482.jpg'
  ) {
    return defaultWelcomeImg;
  }
  return trimmed;
}

function isSupportedImageFile(file: File): boolean {
  if (file.type && file.type.toLowerCase().startsWith('image/')) {
    return true;
  }
  const name = (file.name || '').toLowerCase();
  return /\.(jpe?g|png|webp|gif|bmp|avif)$/.test(name);
}

function drawResizedToCanvas(
  source: ImageBitmap | HTMLImageElement,
  srcWidth: number,
  srcHeight: number,
  maxDimension: number,
  mimeType: 'image/webp' | 'image/jpeg' | 'image/png',
  quality: number
): string {
  let width = srcWidth;
  let height = srcHeight;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.max(1, Math.round((height * maxDimension) / width));
      width = maxDimension;
    } else {
      width = Math.max(1, Math.round((width * maxDimension) / height));
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas tidak tersedia di browser.');
  }

  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL(mimeType, quality);
}

async function encodeSourceWithinLimit(
  source: ImageBitmap | HTMLImageElement,
  srcWidth: number,
  srcHeight: number
): Promise<string> {
  const attempts: Array<{ maxDim: number; mime: 'image/webp' | 'image/jpeg'; quality: number }> = [
    { maxDim: 1280, mime: 'image/webp', quality: 0.86 },
    { maxDim: 1120, mime: 'image/webp', quality: 0.78 },
    { maxDim: 960, mime: 'image/webp', quality: 0.7 },
    { maxDim: 1080, mime: 'image/jpeg', quality: 0.82 },
    { maxDim: 920, mime: 'image/jpeg', quality: 0.72 },
    { maxDim: 760, mime: 'image/jpeg', quality: 0.62 },
    { maxDim: 640, mime: 'image/jpeg', quality: 0.52 }
  ];

  let lastResult = '';
  for (const attempt of attempts) {
    const encoded = drawResizedToCanvas(
      source,
      srcWidth,
      srcHeight,
      attempt.maxDim,
      attempt.mime,
      attempt.quality
    );
    // Verify browser actually honored image/webp (some older WebViews emit image/png)
    if (attempt.mime === 'image/webp' && !encoded.startsWith('data:image/webp')) {
      continue;
    }
    lastResult = encoded;
    if (encoded.length <= MAX_SYNC_DATA_URL_LENGTH) {
      return encoded;
    }
  }

  if (lastResult && lastResult.length <= 800000) {
    return lastResult;
  }

  throw new Error('Ukuran gambar terlalu besar untuk disinkronkan. Gunakan gambar lain atau resolusi lebih kecil.');
}

export async function compressImageFileToDataUrl(
  file: File,
  _maxDimension = 1280,
  _quality = 0.85
): Promise<string> {
  if (!isSupportedImageFile(file)) {
    throw new Error('File yang dipilih bukan gambar yang valid (JPG, PNG, WebP, GIF).');
  }

  // If the file is already tiny (<= 300 KB) and standard image type, read directly so lossless/animated GIF works cleanly
  if (file.size <= 300 * 1024) {
    const directDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
    if (directDataUrl.startsWith('data:image/') && directDataUrl.length <= MAX_SYNC_DATA_URL_LENGTH) {
      return directDataUrl;
    }
  }

  // Prefer native createImageBitmap when available (avoids mobile Chrome FileReader+canvas blank draw bug)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        return await encodeSourceWithinLimit(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
    } catch {
      // Fallback below
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Format gambar tidak dapat dibaca. Gunakan format JPG, PNG, atau WebP.'));
    };
    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode().catch(() => {});
        }
        if (!img.width || !img.height) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Dimensi gambar tidak valid.'));
          return;
        }
        const encoded = await encodeSourceWithinLimit(img, img.width, img.height);
        URL.revokeObjectURL(objectUrl);
        resolve(encoded);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new Error('Gagal memproses gambar.'));
      }
    };
    img.src = objectUrl;
  });
}

/**
 * Compresses and prepares a slide image so it syncs reliably in real time
 * across all devices and shared links via Firestore (no ephemeral container /uploads paths).
 */
export async function uploadSlideImage(file: File): Promise<string> {
  if (!isSupportedImageFile(file)) {
    throw new Error('Pilih file gambar yang valid (JPG, PNG, WebP, atau GIF).');
  }

  if (file.size > 18 * 1024 * 1024) {
    throw new Error('Ukuran file gambar terlalu besar (maksimal 18 MB).');
  }

  return compressImageFileToDataUrl(file);
}
