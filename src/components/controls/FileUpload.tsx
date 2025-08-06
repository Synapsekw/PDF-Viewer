import React, { useRef } from 'react';
import { usePdf } from '../../pdf/PdfContext';

export const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFile } = usePdf();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        // Create a copy of the ArrayBuffer to avoid detachment issues
        const buffer = arrayBuffer.slice(0);
        const uint8Array = new Uint8Array(buffer);
        setFile(uint8Array);
      }
    };
    reader.onerror = (e) => {
      console.error('FileReader error:', e);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="upload-button"
      >
        Upload PDF
      </button>
    </div>
  );
};

export default FileUpload;