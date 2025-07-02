'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { propertyImagesService, type PropertyImage } from '@/services/property-images.service';
import type { PropertyImage as BasePropertyImage } from '@/types/property';

interface ImageUploadProps {
  propertyId: string;
  images: BasePropertyImage[];
  onImagesChange: () => void;
}

export function ImageUpload({ propertyId, images: initialImages, onImagesChange }: ImageUploadProps) {
  // Convert base images to full PropertyImage format
  const convertToFullImage = (img: BasePropertyImage): PropertyImage => ({
    ...img,
    propertyId,
    createdAt: new Date().toISOString(),
    urls: img.urls || undefined,
  });

  const [images, setImages] = useState<PropertyImage[]>(
    initialImages.map(convertToFullImage)
  );
  const [uploading, setUploading] = useState(false);
  const [draggedImage, setDraggedImage] = useState<PropertyImage | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync with parent when images change
  useEffect(() => {
    setImages(initialImages.map(convertToFullImage));
  }, [initialImages, propertyId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erreur',
          description: `${file.name} n'est pas une image valide`,
          variant: 'destructive',
        });
        continue;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: `${file.name} est trop volumineux (max 5MB)`,
          variant: 'destructive',
        });
        continue;
      }

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
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    // Optimistic update
    setImages(prev => prev.filter(img => img.id !== imageId));

    try {
      const { error } = await propertyImagesService.delete(propertyId, imageId);

      if (error) {
        // Revert on error
        onImagesChange();
        throw new Error(error.message || 'Delete failed');
      }

      toast({
        title: 'Image supprimée',
        description: 'L\'image a été supprimée avec succès',
      });
      
      onImagesChange();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression de l\'image',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, image: PropertyImage) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedImage) return;

    const draggedIndex = images.findIndex(img => img.id === draggedImage.id);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedImage(null);
      return;
    }

    // Create new order - optimistic update
    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, removed);
    
    // Update local state immediately
    setImages(newImages);
    setDraggedImage(null);

    // Update order on server
    const updates = newImages.map((img, index) => ({
      id: img.id,
      order: index,
    }));

    try {
      const { error } = await propertyImagesService.updateOrder(propertyId, updates);

      if (error) {
        // Revert on error
        onImagesChange();
        throw new Error(error.message || 'Update order failed');
      }

      toast({
        title: 'Images réorganisées',
        description: 'L\'ordre des images a été mis à jour',
      });
      
      // Sync with parent
      onImagesChange();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la réorganisation des images',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Ajouter des images
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          JPEG, PNG, WebP ou GIF • Max 5MB • Glissez pour réorganiser
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative ${
                dragOverIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <Card
                className={`group relative overflow-hidden cursor-move transition-all ${
                  draggedImage?.id === image.id ? 'opacity-50 scale-95' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, image)}
                onDragEnd={handleDragEnd}
              >
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 text-white rounded p-1">
                    <GripVertical className="h-4 w-4" />
                  </div>
                </div>

                <div className="aspect-video relative">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${image.urls?.medium || image.url}`}
                    alt={image.alt || `Image ${index + 1}`}
                    className="object-cover w-full h-full"
                    draggable={false}
                  />
                  
                  {(index === 0 || image.isPrimary) && (
                    <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Image principale
                    </div>
                  )}
                  
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <Card className="border-dashed">
          <div className="p-8 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Aucune image ajoutée pour le moment
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}