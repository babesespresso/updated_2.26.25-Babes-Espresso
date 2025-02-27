import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import type { GalleryImage } from "../types/gallery";
import { Layout } from "../components/layout";
import { InstagramLogoIcon, TwitterLogoIcon, VideoIcon } from "@radix-ui/react-icons";
import { Button } from "../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { API_BASE_URL } from "../lib/config";

function GalleryGrid({ images }: { images: GalleryImage[] }) {
  console.log('Rendering GalleryGrid with images:', images);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {images.map((image) => (
        <div key={image.id} className="relative group aspect-square overflow-hidden rounded-lg shadow-lg bg-black/20">
          {image.url.endsWith('.mp4') ? (
            <video 
              src={image.url}
              controls
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img 
              src={image.url} 
              alt={image.title} 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <p className="text-white text-sm font-medium mb-2">{image.title}</p>
            {image.description && (
              <p className="text-white/80 text-xs mb-2">{image.description}</p>
            )}
            {image.tags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {(() => {
                  try {
                    // Handle both string and array formats
                    const tagsArray = typeof image.tags === 'string' 
                      ? JSON.parse(image.tags) 
                      : image.tags;
                    
                    return Array.isArray(tagsArray) 
                      ? tagsArray.map((tag, index) => (
                        <span key={index} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
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
            )}
            <div className="flex gap-2">
              <TooltipProvider>
                {image.instagram && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(`https://instagram.com/${image.instagram}`, '_blank')}
                      >
                        <InstagramLogoIcon className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow on Instagram</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {image.twitter && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(`https://twitter.com/${image.twitter}`, '_blank')}
                      >
                        <TwitterLogoIcon className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow on Twitter</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {image.tiktok && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(`https://tiktok.com/@${image.tiktok}`, '_blank')}
                      >
                        <VideoIcon className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow on TikTok</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {image.onlyfans && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(image.onlyfans, '_blank')}
                      >
                        <span className="text-white text-xs font-bold">OF</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Subscribe on OnlyFans</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GalleryPage() {
  console.log('Rendering GalleryPage');
  
  const { data: galleryImages = [], isLoading: galleryLoading, error: galleryError } = useQuery<GalleryImage[]>({
    queryKey: ['gallery'],
    queryFn: async () => {
      console.log('Fetching gallery images...');
      try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`);
        if (response.status === 401) {
          throw new Error('Please log in to view gallery content');
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch gallery images: ${response.status}`);
        }
        const data = await response.json();
        console.log('Gallery images fetched:', data);
        return data;
      } catch (error) {
        console.error('Gallery fetch error:', error);
        throw error;
      }
    },
    retry: 2
  });

  const { data: featuredImages = [], isLoading: featuredLoading, error: featuredError } = useQuery<GalleryImage[]>({
    queryKey: ['featured'],
    queryFn: async () => {
      console.log('Fetching featured images...');
      try {
        const response = await fetch(`${API_BASE_URL}/api/gallery?type=featured`);
        if (response.status === 401) {
          throw new Error('Please log in to view featured content');
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch featured images: ${response.status}`);
        }
        const data = await response.json();
        console.log('Featured images fetched:', data);
        return data;
      } catch (error) {
        console.error('Featured fetch error:', error);
        throw error;
      }
    },
    retry: 2
  });

  console.log('Current state:', {
    galleryImages,
    featuredImages,
    isLoading: galleryLoading || featuredLoading
  });

  const isLoading = galleryLoading || featuredLoading;

  return (
    <Layout>
      <main className="container mx-auto px-4 pt-24">
        <h1 className="text-3xl font-bold text-white mb-8">Gallery</h1>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <p className="text-white/60">Loading gallery content...</p>
          </div>
        ) : galleryError || featuredError ? (
          <div className="flex justify-center items-center min-h-[200px] text-center">
            <div>
              <p className="text-red-400 mb-2">{(galleryError || featuredError)?.message || 'Failed to load gallery content'}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="gallery" className="w-full">
            <TabsList className="mb-6 bg-white/10 border border-white/20">
              <TabsTrigger value="gallery" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Gallery ({galleryImages.length})
              </TabsTrigger>
              <TabsTrigger value="featured" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Featured ({featuredImages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gallery">
              <GalleryGrid images={galleryImages} />
            </TabsContent>

            <TabsContent value="featured">
              <GalleryGrid images={featuredImages} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </Layout>
  );
}
