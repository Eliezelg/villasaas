'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { propertyImagesService, type PropertyImage } from '@/services/property-images.service';

interface ImageUploadProps {
  propertyId: string;
  images: PropertyImage[];
  onImagesChange: () => void;
}


export function ImageUpload({ propertyId, images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
          };
        });
        reader.readAsDataURL(file);
        const base64 = await base64Promise;

        // Upload to server
        const { error } = await propertyImagesService.upload(propertyId, base64, file.name);

        if (error) {
          throw new Error(error.message || 'Upload failed');
        }

        onImagesChange();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: `Échec de l'upload de ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setUploading(false);
  }, [propertyId, onImagesChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading,
  });

  const handleDelete = async (imageId: string) => {
    try {
      const { error } = await propertyImagesService.delete(propertyId, imageId);

      if (error) {
        throw new Error(error.message || 'Delete failed');
      }

      onImagesChange();
      toast({
        title: 'Image supprimée',
        description: 'L\'image a été supprimée avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression de l\'image',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImage(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedImage) return;

    const draggedIndex = images.findIndex(img => img.id === draggedImage);
    if (draggedIndex === -1) return;

    // Create new order
    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    // Update order
    const updates = newImages.map((img, index) => ({
      id: img.id,
      order: index,
    }));

    try {
      const { error } = await propertyImagesService.updateOrder(propertyId, updates);

      if (error) {
        throw new Error(error.message || 'Update order failed');
      }

      onImagesChange();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la réorganisation des images',
        variant: 'destructive',
      });
    }

    setDraggedImage(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {isDragActive
              ? 'Déposez les images ici'
              : 'Glissez-déposez des images ou cliquez pour sélectionner'}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP ou GIF • Max 5MB
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className="group relative overflow-hidden cursor-move"
              draggable
              onDragStart={(e) => handleDragStart(e, image.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="aspect-video relative">
                {image.url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${image.url}`}
                    alt={`Image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Image principale
                  </div>
                )}
                
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}