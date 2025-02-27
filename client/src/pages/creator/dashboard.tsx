import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { CreatorProfile, Gallery } from '@shared/schema';
import { useState } from 'react';

export default function CreatorDashboard() {
  const { toast } = useToast();
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    tags: '',
    file: null as File | null,
    contentRating: 'sfw' as 'sfw' | 'nsfw',
    isPremium: false
  });

  const { data: profile, isLoading: profileLoading } = useQuery<CreatorProfile>({
    queryKey: ['creator-profile'],
    queryFn: async () => {
      const response = await fetch('/api/creator/profile', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    }
  });

  const { data: content, isLoading: contentLoading } = useQuery<Gallery[]>({
    queryKey: ['creator-content'],
    queryFn: async () => {
      const response = await fetch('/api/creator/content', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      return response.json();
    }
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for profile update
  };

  const handleContentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for content upload
  };

  if (profileLoading || contentLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center min-h-[400px]">
            Loading...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Creator Dashboard</h1>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Creator Profile</CardTitle>
                <CardDescription>Manage your public profile and social links</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aliasName">Display Name</Label>
                    <Input
                      id="aliasName"
                      value={profile?.aliasName || ''}
                      placeholder="Your public display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <Input
                      id="instagram"
                      value={profile?.instagram || ''}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter Handle</Label>
                    <Input
                      id="twitter"
                      value={profile?.twitter || ''}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok Handle</Label>
                    <Input
                      id="tiktok"
                      value={profile?.tiktok || ''}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onlyfans">OnlyFans Link</Label>
                    <Input
                      id="onlyfans"
                      value={profile?.onlyfans || ''}
                      placeholder="https://onlyfans.com/..."
                    />
                  </div>

                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Your Content</CardTitle>
                <CardDescription>Upload and manage your content</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContentUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={uploadFormData.title}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={uploadFormData.description}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Image</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setUploadFormData(prev => ({ ...prev, file }));
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: JPEG, PNG, WebP. Max size: 5MB.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={uploadFormData.tags}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="model, featured, etc"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content Rating</Label>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="sfw"
                          name="contentRating"
                          value="sfw"
                          checked={uploadFormData.contentRating === 'sfw'}
                          onChange={(e) => setUploadFormData(prev => ({ 
                            ...prev, 
                            contentRating: e.target.value as 'sfw' | 'nsfw' 
                          }))}
                        />
                        <Label htmlFor="sfw">SFW</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="nsfw"
                          name="contentRating"
                          value="nsfw"
                          checked={uploadFormData.contentRating === 'nsfw'}
                          onChange={(e) => setUploadFormData(prev => ({ 
                            ...prev, 
                            contentRating: e.target.value as 'sfw' | 'nsfw' 
                          }))}
                        />
                        <Label htmlFor="nsfw">18+</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="premium"
                      checked={uploadFormData.isPremium}
                      onChange={(e) => setUploadFormData(prev => ({ 
                        ...prev, 
                        isPremium: e.target.checked 
                      }))}
                    />
                    <Label htmlFor="premium">Premium Content (Requires Subscription)</Label>
                  </div>

                  <Button type="submit">Upload Content</Button>
                </form>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Your Uploaded Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content?.map((item) => (
                      <div key={item.id} className="relative group">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-4">
                          <p className="text-white font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-white/80 text-sm mt-1">{item.description}</p>
                          )}
                          <div className="absolute bottom-4 right-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/creator/content/${item.id}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                  });
                                  if (!response.ok) throw new Error('Delete failed');
                                  toast({ title: 'Success', description: 'Content deleted successfully' });
                                } catch (error) {
                                  toast({ 
                                    title: 'Error', 
                                    description: 'Failed to delete content',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>View your content performance and audience insights</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Analytics implementation */}
                <p>Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Earnings</CardTitle>
                <CardDescription>Track your revenue and subscription stats</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Earnings implementation */}
                <p>Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
