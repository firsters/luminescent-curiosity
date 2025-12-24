import { useState } from "react";
import { useZxing } from "react-zxing";

export default function BarcodeScanner({ onResult, onClose }) {
  const [error, setError] = useState(null);

  // Hints for common food barcode formats
  // To avoid import errors with @zxing/library, we rely on default multi-format reader
  // but ensure constraints allows for good focus.

  const { ref } = useZxing({
    onDecodeResult(result) {
      // eslint-disable-next-line no-console
      console.log("Barcode detected:", result.getText());
      onResult(result.getText());
    },
    onError(err) {
      if (err.name !== "NotFoundException") {
        // eslint-disable-next-line no-console
        console.warn("Scanner error:", err);
      }
    },
    // Use 'ideal' constraints which are more robust than strict 'min'
    constraints: {
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: "continuous", // Attempt to hint focus (experimental)
      },
    },
    timeBetweenDecodingAttempts: 300,
  });

  return (
    <div className="fixed inset-0 bg-black z-[2000]">
      {/* 1. Fullscreen Video */}
      <video
        ref={ref}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 2. Overlay Centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-80 h-80 rounded-3xl border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[scan_2s_infinite]" />

          {/* Corner Markers (Visual Polish) */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />
        </div>

        {error && (
          <div className="absolute bottom-32 left-0 right-0 text-center text-red-500 bg-black/50 p-2">
            {error}
          </div>
        )}
      </div>

      {/* 3. Controls (Floating at bottom) */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-auto">
        <button
          onClick={onClose}
          className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
        >
          취소
        </button>
      </div>
    </div>
  );
}
