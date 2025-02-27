import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "../components/ui/carousel";
import { Footer } from "../components/Footer";
import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { API_BASE_URL } from "../lib/config";

interface GalleryImage {
  id: number;
  url: string;
  title: string;
  type: 'gallery' | 'featured';
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: featuredImages, isLoading, isError } = useQuery<GalleryImage[]>({
    queryKey: ['featured'],
    queryFn: async () => {
      try {
        const data = await apiRequest<GalleryImage[]>('GET', '/api/gallery?type=featured');
        console.log('Fetched featured images:', data);
        return data;
      } catch (error) {
        console.error('Error fetching featured images:', error);
        throw error;
      }
    },
    retry: 2
  });

  const [api, setApi] = useState<CarouselApi>();
  const AUTOPLAY_INTERVAL = 4000;

  useEffect(() => {
    let autoplayInterval: NodeJS.Timeout;
    if (api) {
      autoplayInterval = setInterval(() => {
        api.scrollNext();
      }, AUTOPLAY_INTERVAL);
    }
    return () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    };
  }, [api]);

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full bg-black backdrop-blur-sm z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/logo.png" alt="Logo" className="h-10 hover:opacity-80 transition-opacity" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <Link to="/model-intake">
              <Button variant="ghost" className="hover:bg-white/10">Model Application</Button>
            </Link>
            <Link to="/gallery">
              <Button variant="ghost" className="hover:bg-white/10">Gallery</Button>
            </Link>
            <Link to="/premium">
              <Button variant="ghost" className="hover:bg-white/10">18+ Content</Button>
            </Link>
            <Link to="/auth">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20">Sign In</Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-black/90 backdrop-blur-sm border border-white/10">
                <DropdownMenuItem asChild>
                  <Link to="/model-intake" className="w-full">
                    Model Application
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/gallery" className="w-full">
                    Gallery
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/premium" className="w-full">
                    18+ Content
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/auth" className="w-full">
                    Sign In
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4">
        <section className="min-h-screen flex items-center justify-center py-20 relative">
          <div className="absolute inset-0 z-0">
            <img 
              src="/hero-background.png" 
              alt="Hero background" 
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>
          <div className="max-w-4xl text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Join Our Modeling Team
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Showcase your talent and connect with amazing opportunities in a professional environment
            </p>
            <Link to="/signup?role=creator">
              <Button size="lg" className="gradient-apply-button px-6 md:px-8 py-4 md:py-6 text-lg text-white">
                Apply Now
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Featured Models</h2>
          <div className="container mx-auto px-4 py-8">
            {featuredImages && featuredImages.length > 0 ? (
              <Carousel
                setApi={setApi}
                className="w-full max-w-6xl mx-auto"
              >
                <CarouselContent>
                  {featuredImages.map((image) => (
                    <CarouselItem 
                      key={image.id} 
                      className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 cursor-pointer"
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="text-center text-gray-400">No featured models available</div>
            )}
            {isLoading && <p className="text-center">Loading featured models...</p>}
            {isError && <p className="text-center text-red-500">Failed to load featured models</p>}
          </div>
          {selectedImage && (
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
              <DialogContent className="bg-black/90 border-white/10 max-w-6xl max-h-[90vh] p-0">
                <DialogTitle className="sr-only">Featured Model Image</DialogTitle>
                <DialogDescription className="sr-only">View larger version of the featured model image</DialogDescription>
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Featured model"
                    className="max-w-full max-h-[85vh] object-contain"
                  />
                  <button
                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white"
                    onClick={() => setSelectedImage(null)}
                  >
                    ×
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}