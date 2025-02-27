import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../lib/config";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Layout } from "../components/layout";
import { Spinner } from "../components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PremiumCardProps {
  image: GalleryImage;
  onUnlock: () => void;
}

function PremiumCard({ image, onUnlock }: PremiumCardProps) {
  return (
    <Card className="bg-black/50 border-white/10 cursor-pointer" onClick={onUnlock}>
      <CardContent className="p-4">
        <div className="relative aspect-[3/4] mb-4">
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">Premium Content</div>
              <Button variant="secondary" size="sm">
                Sign In to View
              </Button>
            </div>
          </div>
          <img
            src={image.url}
            alt={image.title}
            className="w-full h-full object-cover blur-lg"
          />
        </div>
        <h3 className="text-xl font-semibold mb-2">{image.title}</h3>
        {image.description && (
          <p className="text-gray-400 mb-4">{image.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface GalleryImage {
  id: number;
  url: string;
  title: string;
  type: string;
  contentRating: 'sfw' | 'nsfw';
  isPremium: boolean;
  tags: string[];
  description?: string;
}

export default function PremiumContent() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { data: images, isLoading, isError, error, refetch } = useQuery<GalleryImage[]>({
    queryKey: ['gallery', 'premium'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/gallery?type=gallery&premium=true`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch premium images: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        
        // Validate response data
        if (!data || !Array.isArray(data)) {
          console.error('Invalid gallery data format:', data);
          throw new Error('Invalid response format from server');
        }
        
        return data;
      } catch (err) {
        console.error('Gallery fetch error:', err);
        throw err;
      }
    },
    retry: 2,
    // Provide fallback data if the query fails
    select: (data) => {
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid gallery data, using empty array');
        return [];
      }
      return data;
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <main className="container mx-auto px-4 py-20">
          <h1 className="text-4xl font-bold mb-8">Premium Content</h1>
          <div className="flex justify-center items-center min-h-[200px]">
            <Spinner size="lg" />
            <span className="ml-3">Loading premium content...</span>
          </div>
        </main>
      </Layout>
    );
  }

  // Error state with retry button
  if (isError) {
    return (
      <Layout>
        <main className="container mx-auto px-4 py-20">
          <h1 className="text-4xl font-bold mb-8">Premium Content</h1>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load premium content'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()}>Try Again</Button>
        </main>
      </Layout>
    );
  }

  // No content state
  if (!images || !Array.isArray(images) || images.length === 0) {
    return (
      <Layout>
        <main className="container mx-auto px-4 py-20">
          <h1 className="text-4xl font-bold mb-8">Premium Content</h1>
          <p>No premium content available at this time.</p>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="container mx-auto px-4 py-20">
        <div className="mb-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Premium Content</h1>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {images.map((image) => (
                    <PremiumCard key={image.id} image={image} onUnlock={() => setShowPaywall(true)} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="photos">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {images
                    .filter(image => image.type === 'photo')
                    .map((image) => (
                      <PremiumCard key={image.id} image={image} onUnlock={() => setShowPaywall(true)} />
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="videos">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {images
                    .filter(image => image.type === 'video')
                    .map((image) => (
                      <PremiumCard key={image.id} image={image} onUnlock={() => setShowPaywall(true)} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>


        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="bg-black/90 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Access Premium Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Premium Membership</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✓ Access to exclusive 18+ content</li>
                  <li>✓ High-resolution photos</li>
                  <li>✓ Behind the scenes content</li>
                  <li>✓ Priority access to new content</li>
                </ul>
                <div className="mt-4">
                  <span className="text-2xl font-bold">$19.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <Link to="/auth">
                  <Button className="w-full">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" className="w-full">Create Account</Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </Layout>
  );
}
