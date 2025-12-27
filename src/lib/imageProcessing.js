import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";

/**
 * Removes the background from an image file/blob.
 * @param {Blob | File} imageBlob
 * @returns {Promise<Blob>} Transparent PNG blob
 */
export async function removeBackground(imageBlob) {
  try {
    // imglyRemoveBackground automatically downloads models on first run
    // returns a Blob
    const blob = await imglyRemoveBackground(imageBlob);
    return blob;
  } catch (error) {
    console.error("Background removal failed:", error);
    throw error;
  }
}

/**
 * Crops the transparent pixels from an image blob.
 * @param {Blob} imageBlob
 * @returns {Promise<Blob>} Cropped image blob
 */
export async function cropTransparent(imageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Find bounding box
      let minX = w,
        minY = h,
        maxX = 0,
        maxY = 0;
      let found = false;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const alpha = data[(y * w + x) * 4 + 3];
          // Use a threshold (e.g., 20) instead of 0 to ignore invisible/faint artifacts
          if (alpha > 20) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            found = true;
          }
        }
      }

      if (!found) {
        // Empty image, return original
        resolve(imageBlob);
        return;
      }

      // Add a small padding
      const padding = 10;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(w, maxX + padding);
      maxY = Math.min(h, maxY + padding);

      const cropWidth = maxX - minX;
      const cropHeight = maxY - minY;

      // Create new canvas for crop
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext("2d");

      cropCtx.drawImage(
        canvas,
        minX,
        minY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      cropCanvas.toBlob((resultBlob) => {
        resolve(resultBlob);
      }, "image/png");
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(imageBlob);
  });
}
