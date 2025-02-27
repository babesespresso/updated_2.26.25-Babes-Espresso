import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "./card";
import { cn } from "../../lib/utils";

interface ImageUploadProps {
  onChange: (file: File) => void;
  value?: File;
  className?: string;
  label: string;
}

export function ImageUpload({ onChange, value, className, label }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      onChange(acceptedFiles[0]);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "p-4 border-2 border-dashed cursor-pointer hover:border-primary transition-colors",
        isDragActive && "border-primary bg-primary/5",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        {value ? (
          <div>
            <img
              src={URL.createObjectURL(value)}
              alt="Preview"
              className="mx-auto max-h-48 object-contain mb-2"
            />
            <p className="text-sm text-muted-foreground">{value.name}</p>
          </div>
        ) : (
          <div className="py-8">
            <p className="text-muted-foreground">{label}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to select
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
