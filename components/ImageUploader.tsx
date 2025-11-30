
import React, { useCallback, useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, Smartphone, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Refs for the hidden inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /**
   * Compresses and resizes an image file to ensure it is under 3MB
   * and optimized for API usage.
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if dimension is too large (max 1500px is sufficient for AI)
          const MAX_DIMENSION = 1500;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            } else {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          
          // Draw image on white background (handle transparent PNGs)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Initial compression
          let quality = 0.85;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Loop to ensure size is under 3MB
          // 3MB = 3 * 1024 * 1024 bytes approx 3,145,728
          const MAX_BYTES = 3 * 1024 * 1024;
          
          while (dataUrl.length > MAX_BYTES && quality > 0.2) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsCompressing(true);

    try {
      // Compress/Resize image before sending up
      const compressedBase64 = await compressImage(file);
      onImageSelect(compressedBase64);
    } catch (error) {
      console.error("Image processing failed:", error);
      alert("Failed to process image. Please try another file.");
    } finally {
      setIsCompressing(false);
    }
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // Clear value so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-xl">
       {/* Hidden File Input (Gallery) */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        ref={fileInputRef}
        disabled={disabled || isCompressing}
      />
      
      {/* Hidden Camera Input (Direct Capture) */}
      <input
        type="file"
        accept="image/*"
        capture="environment" // Forces rear camera on mobile
        onChange={handleFileInputChange}
        className="hidden"
        ref={cameraInputRef}
        disabled={disabled || isCompressing}
      />

      {/* Main Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl border-4 border-dashed transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
            : 'border-stone-300 bg-white hover:border-stone-400'
          }
          ${(disabled || isCompressing) ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {isCompressing ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 size={48} className="text-emerald-600 animate-spin mb-4" />
            <p className="font-bold text-stone-700 text-lg">Optimizing Image...</p>
            <p className="text-stone-400 text-sm">Resizing to &lt; 3MB for analysis</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center mb-6">
               {/* Take Photo Button */}
               <button
                 onClick={() => cameraInputRef.current?.click()}
                 className="flex flex-col items-center justify-center w-full sm:w-44 h-36 bg-stone-50 hover:bg-emerald-50 border-2 border-stone-200 hover:border-emerald-500 text-stone-600 hover:text-emerald-700 rounded-xl transition-all group shadow-sm hover:shadow-md"
               >
                 <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform group-hover:text-emerald-600 text-stone-500">
                    <Camera size={32} />
                 </div>
                 <span className="font-bold text-base">Take Photo</span>
                 <span className="text-xs text-stone-400 mt-1">Use Camera</span>
               </button>

               <div className="text-stone-300 font-bold hidden sm:block">OR</div>

               {/* Upload Button */}
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className="flex flex-col items-center justify-center w-full sm:w-44 h-36 bg-stone-50 hover:bg-blue-50 border-2 border-stone-200 hover:border-blue-500 text-stone-600 hover:text-blue-700 rounded-xl transition-all group shadow-sm hover:shadow-md"
               >
                 <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform group-hover:text-blue-600 text-stone-500">
                    <ImageIcon size={32} />
                 </div>
                 <span className="font-bold text-base">Upload File</span>
                 <span className="text-xs text-stone-400 mt-1">From Gallery</span>
               </button>
            </div>

            <div className="text-center">
              <p className="text-stone-400 text-sm mb-2">
                or drag and drop your image here
              </p>
              <div className="inline-flex items-center gap-2 text-[10px] text-stone-400 font-medium bg-stone-100 px-3 py-1 rounded-full">
                 <Smartphone size={12} />
                 <span>Auto-compressed to &lt; 3MB</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
