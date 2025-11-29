import React, { useCallback, useState } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    // Limit file size to 5MB roughly to avoid massive payloads
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Please upload an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onImageSelect(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full max-w-xl p-8 rounded-2xl border-4 border-dashed transition-all duration-300 ease-in-out cursor-pointer group
        ${isDragging 
          ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
          : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50'
        }
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className={`
          p-5 rounded-full transition-colors duration-300
          ${isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200 group-hover:text-stone-700'}
        `}>
          {isDragging ? <Upload size={40} /> : <Camera size={40} />}
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-semibold text-stone-700">
            {isDragging ? 'Drop it like it\'s hot!' : 'Upload a rock photo'}
          </p>
          <p className="text-sm text-stone-500">
            Click to browse or drag & drop here
          </p>
        </div>
        
        <div className="flex gap-2 text-xs text-stone-400 font-medium bg-stone-50 px-3 py-1 rounded-full">
          <ImageIcon size={14} />
          <span>JPG, PNG, WEBP supported</span>
        </div>
      </div>
    </div>
  );
};
