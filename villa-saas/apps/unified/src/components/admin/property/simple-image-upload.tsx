'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { propertyImagesService, type PropertyImage } from '@/services/property-images.service';

interface ImageUploadProps {
  propertyId: string;
  images: PropertyImage[];
  onImagesChange: () => void;
}

export function ImageUpload({ propertyId, images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    e.dataTransfer.setData('text/plain', imageId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedImage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = e.dataTransfer.getData('text/plain') || draggedImage;
    if (!draggedId) return;

    const draggedIndex = images.findIndex(img => img.id === draggedId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedImage(null);
      return;
    }

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

      // Immediately refresh the images
      onImagesChange();
      
      toast({
        title: 'Images réorganisées',
        description: 'L\'ordre des images a été mis à jour',
      });
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
          JPEG, PNG, WebP ou GIF • Max 5MB
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className={`group relative overflow-hidden cursor-move transition-opacity ${
                draggedImage === image.id ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, image.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="aspect-video relative">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${image.url}`}
                  alt={image.alt || `Image ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                
                {(index === 0 || image.isPrimary) && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Image principale
                  </div>
                )}
                
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={() => handleDelete(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
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