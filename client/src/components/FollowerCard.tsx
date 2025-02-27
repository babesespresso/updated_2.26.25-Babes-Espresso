import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MoreHorizontal, Mail, UserX, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface FollowerCardProps {
  follower: {
    id: number;
    email: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    createdAt: string;
    verified: number;
    followerProfile?: {
      id: number;
      preferences?: any;
      createdAt: string;
    };
  };
}

export function FollowerCard({ follower }: FollowerCardProps) {
  // Parse preferences if they exist
  const preferences = follower.followerProfile?.preferences 
    ? (typeof follower.followerProfile.preferences === 'string' 
        ? JSON.parse(follower.followerProfile.preferences) 
        : follower.followerProfile.preferences)
    : null;
    
  // Format join date
  const joinDate = new Date(follower.createdAt);
  const formattedDate = joinDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const daysSinceJoined = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get initials for avatar fallback
  const name = follower.displayName || follower.username || follower.email;
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card className="w-full overflow-hidden border-muted/60 hover:border-primary/20 transition-all">
      <CardHeader className="pb-2 relative">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {follower.avatarUrl ? (
                <img 
                  src={follower.avatarUrl} 
                  alt={name} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <CardTitle className="text-base">{follower.displayName || follower.username || 'Unnamed Follower'}</CardTitle>
              <CardDescription className="text-xs">{follower.email}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {follower.verified ? (
              <Badge className="bg-green-500 text-xs">Verified</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Unverified</Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Send Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="mr-2 h-4 w-4" />
                  <span>Mark as VIP</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Remove Follower</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <p className="font-medium">Joined:</p>
            <p className="text-muted-foreground">{formattedDate}</p>
            <p className="text-muted-foreground text-xs">{daysSinceJoined} days ago</p>
          </div>
          <div>
            <p className="font-medium">User ID:</p>
            <p className="text-muted-foreground">#{follower.id}</p>
          </div>
        </div>
        
        {preferences && (
          <div className="mt-2">
            <h4 className="text-xs font-medium mb-1">Preferences:</h4>
            <div className="space-y-1">
              {Object.entries(preferences).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!preferences && (
          <p className="text-xs text-muted-foreground italic">No preferences set</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0 pb-3">
        <Button variant="outline" size="sm" className="text-xs h-8">View Details</Button>
        <Button variant="secondary" size="sm" className="text-xs h-8">Message</Button>
      </CardFooter>
    </Card>
  );
}
