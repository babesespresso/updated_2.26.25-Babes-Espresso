import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import { apiRequest } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useState, Suspense, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import type { Model } from "@/../../shared/schema";
import type { GalleryImage } from "../types/gallery";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../components/ui/dropdown-menu";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GalleryItem } from '../components/GalleryItem';
import { CreatorCard } from '../components/CreatorCard';
import { CreatorContent } from '../components/CreatorContent';
import { FollowerCard } from '../components/FollowerCard';
import { API_BASE_URL } from "../lib/config";

interface UploadFormData {
  title: string;
  description: string;
  tags: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  onlyfans: string;
  file: File | null;
  contentRating: 'sfw' | 'nsfw';
  isPremium: boolean;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  const [selectedCreatorName, setSelectedCreatorName] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState(false);
  const [modelsData, setModelsData] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<Error | null>(null);
  const [uploadFormData, setUploadFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    tags: '',
    instagram: '',
    tiktok: '',
    twitter: '',
    onlyfans: '',
    file: null,
    contentRating: 'sfw',
    isPremium: false
  });
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      setModelsError(null);
      
      try {
        console.log('⭐️ Starting models data fetch...');
        const startTime = Date.now();
        
        const data = await apiRequest<any[]>('/api/models', {}, 15000);
        const duration = Date.now() - startTime;
        
        console.log(`⭐️ Models data fetch completed in ${duration}ms`);
        console.log('⭐️ Models data received:', data);
        
        setModelsData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('⭐️ Models fetch error:', error);
        setModelsError(error instanceof Error ? error : new Error('Unknown error'));
        console.log('⭐️ Using empty fallback data for models');
        setModelsData([]);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [toast]);

  const { data: galleryData = [], error: galleryError, isLoading: galleryLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: getQueryFn({ on401: 'redirect' }),
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000, // 1 minute
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      console.log('Gallery data loaded successfully:', data);
    },
    onError: (error) => {
      console.error('Gallery fetch error:', error);
      toast({
        title: 'Error',
        description: `Failed to load gallery: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  const { data: followersData = [], error: followersError, isLoading: followersLoading } = useQuery({
    queryKey: ['followers'],
    queryFn: getQueryFn({ on401: 'redirect' }),
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000, // 1 minute
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Followers fetch error:', error);
      toast({
        title: 'Error',
        description: `Failed to load followers data. Using fallback data.`,
        variant: 'destructive'
      });
    },
    select: (data) => {
      if (!Array.isArray(data)) {
        console.warn('Followers data is not an array, using empty array instead');
        return [];
      }
      return data;
    }
  });

  const { data: creatorsData = { creators: [] }, error: creatorsError, isLoading: creatorsLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: getQueryFn({ on401: 'redirect' }),
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000, // 1 minute
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Creators fetch error:', error);
      toast({
        title: 'Error',
        description: `Failed to load creators data. Using fallback data.`,
        variant: 'destructive'
      });
    },
    select: (data) => {
      if (!data || typeof data !== 'object') {
        console.warn('Creators data is invalid, using empty object instead');
        return { creators: [] };
      }
      
      // Ensure creators property is an array
      if (!Array.isArray(data.creators)) {
        console.warn('Creators data.creators is not an array, using empty array instead');
        return { ...data, creators: [] };
      }
      
      return data;
    }
  });

  const { data: featuredData = [], isLoading: featuredLoading, error: featuredError } = useQuery<GalleryImage[]>({
    queryKey: ['featured'],
    queryFn: getQueryFn<GalleryImage[]>({ 
      on401: "throw"
    }),
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message?.includes('Authentication') || 
          error.message?.includes('session expired')) {
        return false;
      }
      // Only retry twice max
      return failureCount < 2;
    },
    retryDelay: 1000,
    staleTime: 60000, // 1 minute
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Featured content fetch error:', error);
    }
  });

  const filteredModels = modelsData
    .filter((model) =>
      model.first_name.toLowerCase().includes(search.toLowerCase()) ||
      model.last_name.toLowerCase().includes(search.toLowerCase()) ||
      model.email.toLowerCase().includes(search.toLowerCase()) ||
      (model.alias_name && model.alias_name.toLowerCase().includes(search.toLowerCase()))
    );

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProfilePicture(file);
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) return;
    const formData = new FormData();
    formData.append('image', profilePicture);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, { // Assumed API endpoint
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      toast({ title: "Success", description: "Profile picture uploaded successfully" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload profile picture", variant: "destructive" });
    }
  };

  // Robust API request function with timeout handling
  const apiRequest = async (url: string, options: RequestInit, timeoutMs = 60000) => {
    console.log(`Making API request to ${url} with timeout ${timeoutMs}ms`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`Request to ${url} timed out after ${timeoutMs}ms`);
    }, timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Received response from ${url}:`, {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || errorData.details || errorData.error || `Request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  };

  const handleGalleryUpload = async (data: UploadFormData, type: string) => {
    if (!data.file) {
      toast({ title: 'Error', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.file.type)) {
      toast({ 
        title: 'Error', 
        description: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (data.file.size > maxSize) {
      toast({ 
        title: 'Error', 
        description: 'File size too large. Maximum allowed size is 5MB.',
        variant: 'destructive'
      });
      return;
    }

    // Show loading toast
    const loadingToast = toast({ 
      title: 'Uploading...', 
      description: 'Please wait while your image is being uploaded',
      duration: 60000 // Longer duration for large uploads
    });
    
    console.log('Starting gallery upload process', {
      fileName: data.file.name,
      fileType: data.file.type,
      fileSize: data.file.size,
      title: data.title,
      endpoint: `${API_BASE_URL}/api/${type}`
    });

    const formData = new FormData();
    formData.append('image', data.file);
    formData.append('title', data.title || data.file.name);
    formData.append('description', data.description);
    formData.append('tags', JSON.stringify(data.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
    formData.append('contentRating', data.contentRating);
    formData.append('isPremium', String(data.isPremium));
    formData.append('instagram', data.instagram);
    formData.append('tiktok', data.tiktok);
    formData.append('twitter', data.twitter);
    formData.append('onlyfans', data.onlyfans);

    try {
      // Use the proper endpoint instead of the test endpoint
      const endpoint = `/api/${type}`;
      console.log('Sending request to:', `${API_BASE_URL}${endpoint}`);
      
      // Use the new apiRequest function with a 120 second timeout for large files
      const responseData = await apiRequest(`${endpoint}`, {
        method: 'POST',
        body: formData
      }, 120000);
      
      console.log('Upload successful:', responseData);

      toast({ 
        title: 'Success', 
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully` 
      });
      
      // Close the dialog after successful upload
      setGalleryDialogOpen(false);
      
      // Fix: Properly invalidate the correct query key
      if (type === 'gallery') {
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
      } else if (type === 'featured') {
        queryClient.invalidateQueries({ queryKey: ['featured'] });
      }
      
      // Reset form
      setUploadFormData({
        title: '',
        description: '',
        tags: '',
        instagram: '',
        tiktok: '',
        twitter: '',
        onlyfans: '',
        file: null,
        contentRating: 'sfw',
        isPremium: false
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast({ 
            title: 'Upload Timeout', 
            description: 'The upload took too long. Try using a smaller image or check your network connection.',
            variant: 'destructive'
          });
        } else if (error.message.includes('Server storage error')) {
          toast({ 
            title: 'Server Error', 
            description: 'There was an issue with the server storage. Please try again later.',
            variant: 'destructive'
          });
        } else {
          toast({ 
            title: 'Upload Failed', 
            description: error.message || 'Failed to upload image', 
            variant: 'destructive' 
          });
        }
      } else {
        toast({ 
          title: 'Error', 
          description: 'An unexpected error occurred', 
          variant: 'destructive' 
        });
      }
    }
  };

  const handleFeaturedUpload = (file: File) => {
    const formData: UploadFormData = {
      title: file.name,
      description: '',
      tags: '',
      instagram: '',
      tiktok: '',
      twitter: '',
      onlyfans: '',
      file: file,
      contentRating: 'sfw',
      isPremium: false
    };
    handleGalleryUpload(formData, 'featured');
  };

  const handleGalleryImageUpload = (file: File) => {
    const formData: UploadFormData = {
      title: file.name,
      description: '',
      tags: '',
      instagram: '',
      tiktok: '',
      twitter: '',
      onlyfans: '',
      file: file,
      contentRating: 'sfw',
      isPremium: false
    };
    handleGalleryUpload(formData, 'gallery');
  };

  const handleViewCreatorContent = (creatorId: number) => {
    const creator = creatorsData?.creators?.find(c => c.id === creatorId);
    setSelectedCreatorId(creatorId);
    setSelectedCreatorName(creator?.displayName || creator?.username || `Creator #${creatorId}`);
    setViewingContent(true);
  };

  const handleBackToCreators = () => {
    setViewingContent(false);
    setSelectedCreatorId(null);
    setSelectedCreatorName(null);
  };

  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // If loading state persists for more than 10 seconds, force a recovery
    const loadingTimeout = setTimeout(() => {
      if (galleryLoading || creatorsLoading || followersLoading || featuredLoading) {
        console.warn('Loading state persisted for too long, forcing recovery');
        
        // Force refetch data
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
        queryClient.invalidateQueries({ queryKey: ['creators'] });
        queryClient.invalidateQueries({ queryKey: ['followers'] });
        queryClient.invalidateQueries({ queryKey: ['featured'] });
        
        // Show toast to user
        toast({
          title: 'Loading recovery',
          description: 'Attempting to recover from extended loading state',
          variant: 'default'
        });
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [galleryLoading, creatorsLoading, followersLoading, featuredLoading, queryClient, toast]);

  // If we've been loading for too long, show a recovery option
  if (loadingTimeout && (galleryLoading || creatorsLoading || followersLoading || featuredLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Dashboard Loading Issue</h2>
          <p className="text-white/70 mb-6">
            We're having trouble loading the admin dashboard. This could be due to:
          </p>
          <ul className="list-disc pl-5 mb-6 text-white/70 space-y-2">
            <li>Network connectivity issues</li>
            <li>Server is temporarily unavailable</li>
            <li>Browser extension interference</li>
            <li>Authentication session expired</li>
          </ul>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Refresh the Page
            </button>
            <button 
              onClick={() => {
                // Clear React Query cache
                queryClient.clear();
                // Reset loading timeout
                setLoadingTimeout(false);
                // Force refetch all queries
                queryClient.invalidateQueries();
                // Redirect to auth page
                window.location.href = '/auth';
              }} 
              className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="bg-gray-800 text-white px-4 py-2 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37z" />
              <path d="M15 12h3.25" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleProfilePictureUpload}>
              <label htmlFor="profile-picture-upload">
                Upload Profile Picture
              </label>
              <input
                type="file"
                id="profile-picture-upload"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/'}>
              Go to Homepage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37z" />
                  <path d="M15 12h3.25" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creatorsData?.creators?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {creatorsData?.creators?.filter(c => c.approved)?.length || 0} approved
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Array.isArray(followersData) ? followersData.length : 0}</div>
                <p className="text-xs text-muted-foreground">
                  {Array.isArray(followersData) ? followersData.filter(f => f?.verified).length : 0} verified
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{galleryData?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {featuredData?.length || 0} featured
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {creatorsData?.creators?.filter(c => c.approved === 0 || c.approved === false)?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Creator approvals pending
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creatorsData?.creators?.slice(0, 5).map((creator, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        {creator.avatarUrl ? (
                          <img 
                            src={creator.avatarUrl} 
                            alt={creator.username || 'Creator'} 
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/200x200?text=No+Image';
                            }}
                          />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-primary"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {creator.displayName || creator.username || 'Unnamed Creator'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {creator.approved ? 'Approved creator' : 'Pending approval'}
                        </p>
                      </div>
                      <div className="ml-auto text-sm text-muted-foreground">
                        {new Date(creator.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Creator Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { 
                          name: 'Approved', 
                          value: creatorsData?.creators?.filter(c => c.approved)?.length || 0 
                        },
                        { 
                          name: 'Pending', 
                          value: creatorsData?.creators?.filter(c => !c.approved)?.length || 0 
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell key="cell-0" fill="#10b981" />
                      <Cell key="cell-1" fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gallery</CardTitle>
                <CardDescription>Manage gallery content</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    if (confirm("Are you sure you want to remove premium status from all gallery items?")) {
                      try {
                        toast({ title: "Processing", description: "Removing premium status from gallery items..." });
                        const response = await fetch(`${API_BASE_URL}/api/gallery/remove-premium`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          credentials: 'include'
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Failed to update gallery items');
                        }
                        
                        const data = await response.json();
                        toast({ 
                          title: "Success", 
                          description: data.message || `Updated ${data.updatedCount} gallery items` 
                        });
                        
                        // Refresh gallery data
                        queryClient.invalidateQueries({ queryKey: ['gallery'] });
                        queryClient.invalidateQueries({ queryKey: ['featured'] });
                      } catch (error) {
                        console.error('Error removing premium status:', error);
                        toast({ 
                          title: "Error", 
                          description: error instanceof Error ? error.message : 'Failed to update gallery items',
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  Remove All Premium
                </Button>
                <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setGalleryDialogOpen(true)}>Upload</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload to Gallery</DialogTitle>
                      <DialogDescription>
                        Upload images to the gallery. Supported formats: JPEG, PNG, WebP.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={uploadFormData.title}
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={uploadFormData.description}
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="instagram">Instagram Handle</Label>
                        <Input
                          id="instagram"
                          value={uploadFormData.instagram}
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, instagram: e.target.value }))}
                          placeholder="@username"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="twitter">Twitter Handle</Label>
                        <Input
                          id="twitter"
                          value={uploadFormData.twitter}
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, twitter: e.target.value }))}
                          placeholder="@username"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="tiktok">TikTok Handle</Label>
                        <Input
                          id="tiktok"
                          value={uploadFormData.tiktok}
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                          placeholder="@username"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="onlyfans">OnlyFans Link</Label>
                        <Input
                          id="onlyfans"
                          value={uploadFormData.onlyfans}
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, onlyfans: e.target.value }))}
                          placeholder="https://onlyfans.com/..."
                        />
                      </div>
                      <div className="grid gap-2">
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
                              onChange={(e) => setUploadFormData(prev => ({ ...prev, contentRating: e.target.value as 'sfw' | 'nsfw' }))}
                              className="text-primary"
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
                              onChange={(e) => setUploadFormData(prev => ({ ...prev, contentRating: e.target.value as 'sfw' | 'nsfw' }))}
                              className="text-primary"
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
                          onChange={(e) => setUploadFormData(prev => ({ ...prev, isPremium: e.target.checked }))}
                          className="text-primary"
                        />
                        <Label htmlFor="premium">Premium Content (Requires Subscription)</Label>
                      </div>

                      <div className="grid gap-2">
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
                    </div>
                    <DialogFooter>
                      <Button onClick={() => handleGalleryUpload(uploadFormData, 'gallery')}>Submit</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {galleryError && (
                <div className="text-red-500 mb-4">
                  Error loading gallery: {galleryError instanceof Error ? galleryError.message : 'Unknown error'}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {galleryLoading ? (
                  <div className="col-span-full text-center py-8">Loading gallery content...</div>
                ) : galleryError ? (
                  <div className="col-span-full text-center py-8 text-red-500">
                    Error loading gallery: {galleryError instanceof Error ? galleryError.message : 'Unknown error'}
                  </div>
                ) : !galleryData?.length ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">No gallery images uploaded yet</div>
                ) : (
                  galleryData.map((image) => (
                    <GalleryItem key={image.id} image={image} type="gallery" />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Featured Models</CardTitle>
              <CardDescription>Manage featured models that appear on the homepage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        // Validate file type
                        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                          toast({ 
                            title: 'Error', 
                            description: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 
                            variant: 'destructive' 
                          });
                          return;
                        }

                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('title', file.name);
                        formData.append('type', 'featured');
                        
                        const response = await apiRequest('/api/featured', {
                          method: 'POST',
                          body: formData,
                          credentials: 'include'
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.message || 'Upload failed');
                        }

                        const result = await response.json();
                        console.log('Upload successful:', result);
                        
                        queryClient.invalidateQueries({ queryKey: ['featured'] });
                        toast({ title: 'Success', description: 'Featured model uploaded successfully' });
                        
                        // Reset the file input
                        e.target.value = '';
                      } catch (error) {
                        console.error('Upload error:', error);
                        toast({ 
                          title: 'Error', 
                          description: error instanceof Error ? error.message : 'Failed to upload featured model', 
                          variant: 'destructive' 
                        });
                      }
                    }
                  }}
                />
                <Button variant="outline" onClick={() => document.getElementById('featured-upload')?.click()}>Upload Featured Model</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {featuredLoading ? (
                  <div className="col-span-full text-center py-8">Loading featured content...</div>
                ) : !featuredData?.length ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">No featured models uploaded yet</div>
                ) : featuredData?.map((image) => (
                  <GalleryItem key={image.id} image={image} type="featured" />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Applications</CardTitle>
              <CardDescription>Review and manage model applications</CardDescription>
            </CardHeader>
            <CardContent>
              {modelsError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-lg font-medium mb-2">Error loading model applications</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {modelsError.message || 'Unknown error'}
                  </p>
                  <p className="text-sm text-amber-600 mb-4">
                    There appears to be an issue with the database connection. Our team is working to fix this.
                  </p>
                  <Button 
                    onClick={() => {
                      setModelsLoading(true);
                      setModelsError(null);
                      
                      // First try the real API
                      const fetchModels = async () => {
                        try {
                          console.log('Retrying models data fetch with extended timeout...');
                          const data = await apiRequest<any[]>('/api/models', {}, 20000);
                          console.log('Models data received:', data);
                          setModelsData(Array.isArray(data) ? data : []);
                        } catch (error) {
                          console.error('Models fetch retry error:', error);
                          
                          // If it fails, use empty fallback data
                          console.log('Using empty fallback data for models');
                          setModelsData([]);
                          
                          // Show a toast notification about using fallback
                          toast({
                            title: 'Using Fallback Data',
                            description: 'Could not connect to database. Using empty model list as fallback.',
                            variant: 'default'
                          });
                        } finally {
                          setModelsLoading(false);
                        }
                      };
                      
                      fetchModels();
                    }}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              ) : modelsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading model applications...
                </div>
              ) : !modelsData?.length ? (
                <div className="text-center py-12 border border-dashed rounded-lg border-muted-foreground/20">
                  <h3 className="text-lg font-medium mb-2">No Model Applications Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    When models apply to join Babes Espresso, their applications will appear here for review.
                  </p>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/'}
                    >
                      Go to Homepage
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Search models..."
                      className="max-w-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-medium">Name</th>
                          <th className="p-2 text-left font-medium">Email</th>
                          <th className="p-2 text-left font-medium">Phone</th>
                          <th className="p-2 text-left font-medium">Alias</th>
                          <th className="p-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelsData
                          .filter((model) =>
                            model.first_name.toLowerCase().includes(search.toLowerCase()) ||
                            model.last_name.toLowerCase().includes(search.toLowerCase()) ||
                            model.email.toLowerCase().includes(search.toLowerCase()) ||
                            (model.alias_name && model.alias_name.toLowerCase().includes(search.toLowerCase()))
                          )
                          .map((model, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{model.first_name} {model.last_name}</td>
                              <td className="p-2">{model.email}</td>
                              <td className="p-2">{model.phone}</td>
                              <td className="p-2">{model.alias_name || '-'}</td>
                              <td className="p-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">View Details</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Model Application Details</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h3 className="font-medium mb-2">Personal Information</h3>
                                        <div className="space-y-2">
                                          <div>
                                            <span className="font-medium">Name:</span> {model.first_name} {model.last_name}
                                          </div>
                                          <div>
                                            <span className="font-medium">Email:</span> {model.email}
                                          </div>
                                          <div>
                                            <span className="font-medium">Phone:</span> {model.phone}
                                          </div>
                                          <div>
                                            <span className="font-medium">Date of Birth:</span> {model.date_of_birth}
                                          </div>
                                          <div>
                                            <span className="font-medium">Alias:</span> {model.alias_name || '-'}
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <h3 className="font-medium mb-2">Social Media</h3>
                                        <div className="space-y-2">
                                          <div>
                                            <span className="font-medium">Platforms:</span> {
                                              typeof model.social_platforms === 'string' 
                                                ? JSON.parse(model.social_platforms).join(', ') 
                                                : Array.isArray(model.social_platforms) 
                                                  ? model.social_platforms.join(', ') 
                                                  : '-'
                                            }
                                          </div>
                                          <div>
                                            <span className="font-medium">Handles:</span> {model.social_handles || '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">OnlyFans:</span> {model.onlyfans_link || '-'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-span-1 md:col-span-2">
                                        <h3 className="font-medium mb-2">Photos</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm mb-1">Body Photo</p>
                                            {model.body_photo_url ? (
                                              <a href={`${API_BASE_URL}${model.body_photo_url}`} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                  src={`${API_BASE_URL}${model.body_photo_url}`} 
                                                  alt="Body Photo" 
                                                  className="max-w-full h-auto rounded-md border"
                                                />
                                              </a>
                                            ) : (
                                              <div className="text-muted-foreground">No body photo available</div>
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-sm mb-1">License Photo (ID)</p>
                                            {model.license_photo_url ? (
                                              <a href={`${API_BASE_URL}${model.license_photo_url}`} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                  src={`${API_BASE_URL}${model.license_photo_url}`} 
                                                  alt="License Photo" 
                                                  className="max-w-full h-auto rounded-md border"
                                                />
                                              </a>
                                            ) : (
                                              <div className="text-muted-foreground">No license photo available</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-4">
                                        <h3 className="font-medium mb-2">Terms & Conditions</h3>
                                        <div>
                                          <span className="font-medium">Terms Accepted:</span> {
                                            typeof model.terms_accepted === 'string'
                                              ? JSON.parse(model.terms_accepted).every(Boolean) ? 'Yes' : 'No'
                                              : Array.isArray(model.terms_accepted)
                                                ? model.terms_accepted.every(Boolean) ? 'Yes' : 'No'
                                                : 'Unknown'
                                          }
                                        </div>
                                      </div>
                                    </div>
                                    <DialogFooter className="mt-4">
                                      <Button variant="outline" onClick={() => {
                                        // Implement approval logic here
                                        toast({
                                          title: "Feature not implemented",
                                          description: "Model approval functionality is not yet implemented",
                                        });
                                      }}>
                                        Approve
                                      </Button>
                                      <Button variant="destructive" onClick={() => {
                                        // Implement rejection logic here
                                        toast({
                                          title: "Feature not implemented",
                                          description: "Model rejection functionality is not yet implemented",
                                        });
                                      }}>
                                        Reject
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators">
          <Card>
            <CardHeader>
              <CardTitle>Creators</CardTitle>
              <CardDescription>Manage creators</CardDescription>
            </CardHeader>
            <CardContent>
              {viewingContent && selectedCreatorId ? (
                <div>
                  <Button 
                    variant="outline" 
                    className="mb-4"
                    onClick={handleBackToCreators}
                  >
                    ← Back to Creators
                  </Button>
                  <CreatorContent 
                    creatorId={selectedCreatorId} 
                    creatorName={selectedCreatorName || undefined} 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {creatorsLoading ? (
                    <div className="col-span-full text-center py-8">Loading creators...</div>
                  ) : !creatorsData?.creators?.length ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">No creators found</div>
                  ) : (
                    creatorsData.creators.map((creator) => (
                      <CreatorCard key={creator.id} creator={creator} onViewContent={handleViewCreatorContent} />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Followers</CardTitle>
                  <CardDescription className="mt-1">Manage your site followers and subscribers</CardDescription>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-sm font-medium">
                  {followersData?.length || 0} total followers
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Filter</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>All followers</DropdownMenuItem>
                    <DropdownMenuItem>Premium subscribers</DropdownMenuItem>
                    <DropdownMenuItem>Recent followers</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {followersLoading ? (
                <div className="text-center py-8">Loading followers...</div>
              ) : !followersData?.length ? (
                <div className="text-center py-8 text-muted-foreground">No followers found</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {followersData
                      .filter(follower => 
                        !search || 
                        follower.email.toLowerCase().includes(search.toLowerCase()) ||
                        (follower.username && follower.username.toLowerCase().includes(search.toLowerCase())) ||
                        (follower.displayName && follower.displayName.toLowerCase().includes(search.toLowerCase()))
                      )
                      .map((follower) => (
                        <FollowerCard key={follower.id} follower={follower} />
                      ))}
                  </div>
                  {followersData.length > 0 && followersData.filter(follower => 
                    !search || 
                    follower.email.toLowerCase().includes(search.toLowerCase()) ||
                    (follower.username && follower.username.toLowerCase().includes(search.toLowerCase())) ||
                    (follower.displayName && follower.displayName.toLowerCase().includes(search.toLowerCase()))
                  ).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No followers match your search</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>Configure your site information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" defaultValue="Babes Espresso" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input id="siteDescription" defaultValue="Premium content from your favorite baristas" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" defaultValue="contact@babesespresso.com" type="email" />
                </div>
                <Button className="mt-2">Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Manage your social media links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" defaultValue="@babesespresso" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input id="twitter" defaultValue="@babesespresso" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input id="tiktok" defaultValue="@babesespresso" />
                </div>
                <Button className="mt-2">Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Subscription Settings</CardTitle>
                <CardDescription>Configure your subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Premium Plan</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Price</span>
                        <div className="flex items-center gap-2">
                          <span>$</span>
                          <Input className="w-20" defaultValue="19.99" />
                          <span>/month</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Active</span>
                        <input type="checkbox" defaultChecked className="toggle" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">Update Plan</Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 border-dashed flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-semibold mb-2">Add New Plan</h3>
                    <p className="text-muted-foreground text-sm mb-4">Create a new subscription plan for your users</p>
                    <Button variant="outline">Add Plan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Add New Plan Section */}
        <TabsContent value="plans">
          <div className="grid gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="border rounded-lg p-4 border-dashed flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-semibold mb-2">Add New Plan</h3>
                    <p className="text-muted-foreground text-sm mb-4">Create a new subscription plan for your users</p>
                    <Button variant="outline">Add Plan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}