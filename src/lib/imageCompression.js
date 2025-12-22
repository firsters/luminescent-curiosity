export async function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    // 1. Create an image element
    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      image.src = e.target.result;
    };

    reader.onerror = (e) => {
      reject(e);
    };

    image.onload = () => {
      // 2. Calculate new dimensions
      let width = image.width;
      let height = image.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // 3. Create canvas and draw
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);

      // 4. Convert to Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Recreate a File object to keep original name/type if needed,
            // but usually Blob is fine for uploadBytes.
            // Let's return a File to be safe for existing logic that might check .name
            const newFile = new File([blob], file.name, {
              type: "image/jpeg", // Consistently compress as JPEG for better ratio usually
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            reject(new Error("Canvas is empty"));
          }
        },
        "image/jpeg",
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}
