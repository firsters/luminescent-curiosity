import { useState } from "react";
import { useZxing } from "react-zxing";

export default function BarcodeScanner({ onResult, onClose }) {
  const [error, setError] = useState(null);

  // Hints for common food barcode formats
  // Note: BrowserBarcodeReader from @zxing/library might generate these constants
  // But react-zxing passes "hints" to the underlying BrowserMultiFormatReader.
  // Using explicit format strings often helps.
  // However, react-zxing 2.x API simplifies this usually.

  // Let's try adding explicit constraints first which is the most common issue.
  const { ref } = useZxing({
    onDecodeResult(result) {
      console.log("Barcode detected:", result.getText());
      onResult(result.getText());
    },
    onError(err) {
      // Only log meaningful errors, not "NotFound"
      if (err.name !== "NotFoundException") {
        console.warn("Scanner error:", err);
      }
    },
    // Constraints: Prefer back camera, higher res
    constraints: {
      video: {
        facingMode: "environment",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        // objectFit: "cover" is CSS, not a constraint
      },
    },
    // Time between scans in ms
    timeBetweenDecodingAttempts: 300,
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "black",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, position: "relative" }}>
        <video
          ref={ref}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            border: "2px solid white",
            width: "250px",
            height: "250px",
            borderRadius: "20px",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        >
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[scan_2s_infinite]" />
        </div>
        {error && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: 0,
              right: 0,
              color: "red",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
      <div style={{ padding: "20px", background: "rgba(0,0,0,0.8)" }}>
        <button
          className="btn btn-secondary"
          onClick={onClose}
          style={{ background: "white", color: "black" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
