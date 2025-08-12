import React, { useRef } from 'react';
import { FiUpload } from 'react-icons/fi';

interface WelcomeMessageProps {
  onFileUpload?: (file: File) => void;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-8 max-w-sm text-center shadow-lg">
        <div className="flex justify-center mb-4 text-slate-400 text-4xl">
          <FiUpload />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Upload a PDF
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Select a PDF file to begin viewing and analyzing with AI assistance
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleUploadClick}
            className="flex items-center justify-center gap-2 text-slate-400 text-xs px-4 py-2 bg-slate-700/30 rounded-lg border border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 hover:text-slate-300 transition-all duration-300 cursor-pointer"
          >
            <FiUpload size={12} />
            Click here to upload a PDF
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default WelcomeMessage;
