/**
 * Image optimization utilities for AI providers
 * Reduces image size before base64 encoding to save bandwidth and API costs
 */

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

/**
 * Optimizes an image by resizing and compressing it
 * @param {string} dataUrl - Base64 data URL of the image
 * @returns {Promise<string>} - Optimized base64 data URL
 */
export const optimizeImage = async (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with compression
        const optimized = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(optimized);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * Extracts base64 data without the data URL prefix
 * @param {string} dataUrl - Base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @returns {string} - Pure base64 string
 */
export const getBase64WithoutPrefix = (dataUrl) => {
  if (!dataUrl) return '';
  const commaIndex = dataUrl.indexOf(',');
  return commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;
};

/**
 * Extracts MIME type from data URL
 * @param {string} dataUrl - Base64 data URL
 * @returns {string} - MIME type (e.g., "image/jpeg")
 */
export const getMimeType = (dataUrl) => {
  if (!dataUrl) return 'image/jpeg';
  const match = dataUrl.match(/^data:(.*?);base64,/);
  return match ? match[1] : 'image/jpeg';
};

/**
 * Prepares image for API request with optimization
 * @param {Object} image - Image object with data property
 * @returns {Promise<{dataUrl: string, base64: string, mimeType: string}>}
 */
export const prepareImage = async (image) => {
  if (!image || !image.data) {
    return null;
  }

  // Optimize the image first
  const optimizedDataUrl = await optimizeImage(image.data);
  
  return {
    dataUrl: optimizedDataUrl,
    base64: getBase64WithoutPrefix(optimizedDataUrl),
    mimeType: getMimeType(optimizedDataUrl)
  };
};

/**
 * Gets image dimensions from data URL
 * @param {string} dataUrl - Base64 data URL
 * @returns {Promise<{width: number, height: number}>}
 */
export const getImageDimensions = async (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};
