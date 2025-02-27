import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import type { GalleryImage } from "../types/gallery";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../lib/config";

interface GalleryItemProps {
  image: GalleryImage;
  type?: 'gallery' | 'featured';
}

export function GalleryItem({ image, type = 'gallery' }: GalleryItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      toast({ title: 'Deleting...', description: 'Removing image from gallery' });
      
      // Add error handling for browser extension interference
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/api/gallery/${image.id}`, {
        method: 'DELETE',
        credentials: 'include',
        signal: controller.signal
      }).catch(error => {
        // Handle network errors or aborts
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. This may be due to browser extension interference.');
        }
        throw error;
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(errorData.message || errorData.details || 'Delete failed');
      }
      
      // Invalidate all gallery queries to ensure proper updates
      await queryClient.invalidateQueries({ queryKey: ['gallery'] });
      
      toast({ title: 'Success', description: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      
      // Check for extension interference
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      const isExtensionError = 
        typeof errorMessage === 'string' && 
        (errorMessage.includes('redacted') || 
         errorMessage.includes('extension') || 
         errorMessage.includes('useUserExtension'));
      
      toast({ 
        title: 'Error', 
        description: isExtensionError 
          ? 'Browser extension interference detected. Try disabling extensions or using incognito mode.' 
          : errorMessage,
        variant: 'destructive' 
      });
    }
  };

  const togglePremium = async () => {
    try {
      toast({ 
        title: 'Updating...', 
        description: `${image.isPremium ? 'Removing' : 'Adding'} premium status` 
      });
      
      const response = await fetch(`${API_BASE_URL}/api/gallery/${image.id}/premium`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPremium: !image.isPremium }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.details || 'Update failed');
      }
      
      // Invalidate all gallery queries to ensure proper updates
      await queryClient.invalidateQueries({ queryKey: ['gallery'] });
      
      toast({ 
        title: 'Success', 
        description: `Premium status ${image.isPremium ? 'removed' : 'added'} successfully` 
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update premium status', 
        variant: 'destructive' 
      });
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(image.url);
    toast({ title: 'Success', description: 'Image URL copied to clipboard' });
  };

  return (
    <div className="relative group">
      <img
        src={image.url.startsWith('http') ? image.url : `/uploads/${image.url.split('/').pop()}`}
        alt={image.title}
        className="w-full h-48 object-cover rounded-lg"
        onError={(e) => {
          // Handle image loading errors
          console.error(`Failed to load image: ${image.url}`);
          
          // Try alternative path if the original path fails
          const currentSrc = e.currentTarget.src;
          if (!currentSrc.includes('?fallback=true')) {
            // Try with a different base path
            const imagePath = image.url.split('/').pop();
            e.currentTarget.src = `/uploads/${imagePath}?fallback=true`;
            return;
          }
          
          // If fallback also fails, use placeholder
          e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Not+Found';
        }}
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white font-medium">{image.title}</p>
            <div className="flex items-center space-x-2">
              {image.contentRating === 'nsfw' && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">18+</span>
              )}
              {image.isPremium && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Premium</span>
              )}
            </div>
          </div>
          
          {image.description && (
            <p className="text-white/80 text-sm">{image.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {image.tags && (() => {
              try {
                // Handle both string and array formats
                const tagsArray = typeof image.tags === 'string' 
                  ? JSON.parse(image.tags) 
                  : image.tags;
                
                return Array.isArray(tagsArray) 
                  ? tagsArray.map((tag: string, index: number) => (
                    <span key={index} className="bg-blue-500/50 text-white text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))
                  : null;
              } catch (e) {
                console.error('Error parsing tags:', e, image.tags);
                return null;
              }
            })()}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-col space-y-2">
          <p className="text-white/80 text-sm">
            Created: {new Date(image.createdAt).toLocaleDateString()}
          </p>

          <div className="flex flex-wrap gap-2">
            {image.instagram && (
              <a 
                href={`https://instagram.com/${image.instagram}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white text-sm hover:text-blue-400"
              >
                <i className="fab fa-instagram"></i> @{image.instagram}
              </a>
            )}
            {image.twitter && (
              <a 
                href={`https://twitter.com/${image.twitter}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white text-sm hover:text-blue-400"
              >
                <i className="fab fa-twitter"></i> @{image.twitter}
              </a>
            )}
            {image.tiktok && (
              <a 
                href={`https://tiktok.com/@${image.tiktok}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white text-sm hover:text-blue-400"
              >
                <i className="fab fa-tiktok"></i> @{image.tiktok}
              </a>
            )}
            {image.onlyfans && (
              <a 
                href={image.onlyfans} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white text-sm hover:text-blue-400"
              >
                <i className="fas fa-heart"></i> OnlyFans
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          onClick={copyUrl}
        >
          Copy URL
        </Button>
        <Button
          variant={image.isPremium ? "outline" : "default"}
          size="sm"
          onClick={togglePremium}
        >
          {image.isPremium ? "Remove Premium" : "Make Premium"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
