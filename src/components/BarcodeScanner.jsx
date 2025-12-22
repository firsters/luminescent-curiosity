import { useState } from 'react';
import { useZxing } from "react-zxing";

export default function BarcodeScanner({ onResult, onClose }) {
  const [error, setError] = useState(null);

  const { ref } = useZxing({
    onDecodeResult(result) {
      onResult(result.getText());
    },
    onError(err) {
      // Ignore frequent "not found" errors, only show critical ones if needed
      // setError(err.message);
    },
  });

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'black', 
      zIndex: 2000, 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
         <video ref={ref} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
         <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: '2px solid white',
            width: '250px',
            height: '250px',
            borderRadius: '20px'
         }} />
         {error && <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, color: 'red', textAlign: 'center' }}>{error}</div>}
      </div>
      <div style={{ padding: '20px', background: 'rgba(0,0,0,0.8)' }}>
        <button className="btn btn-secondary" onClick={onClose} style={{ background: 'white', color: 'black' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
