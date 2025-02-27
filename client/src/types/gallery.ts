export interface GalleryImage {
  id: number;
  url: string;
  title: string;
  type: 'gallery' | 'featured';
  contentRating: 'sfw' | 'nsfw';
  isPremium: boolean;
  createdAt: string;
  description?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  onlyfans?: string;
  tags?: string[];
}
