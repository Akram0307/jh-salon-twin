import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Camera, X, Upload } from 'lucide-react';
import Image from 'next/image';

interface ResponsiveImageUploadProps {
  currentImage?: string | null;
  onImageChange: (file: File | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ResponsiveImageUpload({ 
  currentImage, 
  onImageChange, 
  className,
  size = 'md'
}: ResponsiveImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange(file);
    } else {
      setPreview(null);
      onImageChange(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-center',
      className
    )}>
      {/* Image Preview */}
      <div 
        className={cn(
          'relative shrink-0 self-center sm:self-auto rounded-full overflow-hidden',
          'border-2 border-dashed transition-colors',
          sizeClasses[size],
          isDragging 
            ? 'border-gold-400 bg-gold-400/10' 
            : 'border-slate-700 bg-slate-800/50',
          !preview && 'flex items-center justify-center'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Profile preview"
            fill
            className="object-cover"
          />
        ) : (
          <Camera className="h-8 w-8 text-slate-500" />
        )}
        
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-gold-400/20">
            <Upload className="h-6 w-6 text-gold-400" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload profile photo"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'w-full sm:w-auto inline-flex items-center justify-center gap-2',
            'px-4 py-2.5 min-h-11 rounded-lg text-sm font-medium',
            'bg-gold-500/10 text-gold-400 border border-gold-500/20',
            'hover:bg-gold-500/20 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
          )}
        >
          <Camera className="h-4 w-4" />
          <span>{preview ? 'Change Photo' : 'Upload Photo'}</span>
        </button>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center gap-2',
              'px-4 py-2.5 min-h-11 rounded-lg text-sm font-medium',
              'bg-rose-500/10 text-rose-400 border border-rose-500/20',
              'hover:bg-rose-500/20 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
            )}
          >
            <X className="h-4 w-4" />
            <span>Remove</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ResponsiveImageUpload;
