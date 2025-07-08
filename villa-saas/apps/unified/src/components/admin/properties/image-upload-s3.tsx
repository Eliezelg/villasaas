'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import { SortableImage } from './sortable-image'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { propertiesService } from '@/services/properties.service'
import { propertyImagesService } from '@/services/property-images.service'

interface ImageUploadS3Props {
  propertyId: string
  images: Array<{
    id: string
    url: string
    urls?: {
      small?: string
      medium?: string
      large?: string
      original?: string
    }
    alt?: string
    order: number
  }>
  onImagesChange: (images: any[]) => void
  maxImages?: number
}

export function ImageUploadS3({ propertyId, images, onImagesChange, maxImages = 20 }: ImageUploadS3Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      toast({
        title: 'Limite atteinte',
        description: `Vous ne pouvez ajouter que ${maxImages} images maximum.`,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    const newImages = [...images]

    for (const file of acceptedFiles) {
      const fileId = Math.random().toString(36).substring(7)
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

        // Option 1: Upload direct vers l'API (le backend gère S3)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('metadata', JSON.stringify({
          alt: file.name.split('.')[0],
        }))

        // Récupérer le token depuis localStorage
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/properties/${propertyId}/images`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const uploadedImage = await response.json()
        newImages.push({
          ...uploadedImage,
          order: newImages.length,
        })

        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: 'Erreur',
          description: `Impossible d'uploader ${file.name}`,
          variant: 'destructive',
        })
      } finally {
        setUploadProgress(prev => {
          const { [fileId]: _, ...rest } = prev
          return rest
        })
      }
    }

    onImagesChange(newImages)
    setUploading(false)
  }, [images, maxImages, propertyId, onImagesChange, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  })

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id)
      const newIndex = images.findIndex(img => img.id === over.id)

      const newImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        order: index,
      }))

      onImagesChange(newImages)

      // Mettre à jour l'ordre sur le serveur
      try {
        await propertyImagesService.updateOrder(
          propertyId,
          newImages.map(img => ({ id: img.id, order: img.order }))
        )
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de mettre à jour l\'ordre des images',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDelete = async (imageId: string) => {
    try {
      await propertyImagesService.delete(propertyId, imageId)
      onImagesChange(images.filter(img => img.id !== imageId))
      toast({
        title: 'Succès',
        description: 'Image supprimée',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'image',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Déposez les images ici...'
            : 'Glissez-déposez des images ici, ou cliquez pour sélectionner'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, WebP jusqu'à 10MB • Maximum {maxImages} images
        </p>
      </div>

      {/* Progress bars */}
      {Object.entries(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="bg-gray-100 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-600">{progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Images triables */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  id={image.id}
                  url={image.urls?.medium || image.url}
                  alt={image.alt || `Image ${images.indexOf(image) + 1}`}
                  onRemove={() => handleDelete(image.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Info */}
      {images.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <AlertCircle className="h-4 w-4" />
          <span>
            {images.length} / {maxImages} images • Glissez-déposez pour réorganiser
          </span>
        </div>
      )}
    </div>
  )
}