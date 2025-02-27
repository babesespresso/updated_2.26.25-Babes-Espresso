import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "../hooks/use-toast";

interface CreatorContentProps {
  creatorId: number;
  creatorName?: string;
}

interface ContentItem {
  id: number;
  title: string;
  description?: string;
  contentType: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  isPremium: boolean;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export function CreatorContent({ creatorId, creatorName }: CreatorContentProps) {
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/creators/${creatorId}/content`],
    queryFn: getQueryFn<ContentItem[]>({ on401: 'redirect' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Content from {creatorName || `Creator #${creatorId}`}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Error loading content</h3>
        <p className="text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : 'Failed to load creator content'}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Content from {creatorName || `Creator #${creatorId}`}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">This creator hasn't posted any content yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content from {creatorName || `Creator #${creatorId}`}</h2>
        <div className="text-sm text-gray-500">{data.length} items</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
              {item.contentType === 'image' ? (
                <img
                  src={item.url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${item.url}`);
                    e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
              )}
              {item.isPremium && (
                <Badge className="absolute top-2 right-2 bg-yellow-500">Premium</Badge>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>
                Posted on {new Date(item.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-xs">
                  {item.contentType}
                </Badge>
                {item.isPremium && item.price && (
                  <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
