import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { useToast } from "../hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CreatorCardProps {
  creator: {
    id: number;
    email: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    createdAt: string;
    approved: boolean;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    onlyfans?: string;
    creatorProfile?: {
      id: number;
      aliasName?: string;
      featuredImageUrl?: string;
      approvalStatus: 'pending' | 'approved' | 'rejected';
      approvalDate?: string;
      rejectionReason?: string;
    };
  };
  onViewContent: (creatorId: number) => void;
}

export function CreatorCard({ creator, onViewContent }: CreatorCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/creators/${creator.id}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalStatus: 'approved',
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve creator');
      }

      toast({ title: 'Success', description: 'Creator approved successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/creators'] });
      setIsApprovalDialogOpen(false);
    } catch (error) {
      console.error('Approval error:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to approve creator', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please provide a reason for rejection', 
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/creators/${creator.id}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalStatus: 'rejected',
          rejectionReason,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject creator');
      }

      toast({ title: 'Success', description: 'Creator rejected successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/creators'] });
      setIsRejectionDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Rejection error:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to reject creator', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const status = creator.creatorProfile?.approvalStatus || 'pending';
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{creator.displayName || creator.username || 'Unnamed Creator'}</CardTitle>
            <CardDescription>{creator.email}</CardDescription>
          </div>
          {creator.approved ? (
            <Badge className="bg-green-500">Approved</Badge>
          ) : (
            <Badge variant="outline">Pending Approval</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <p className="text-sm font-medium">Joined:</p>
            <p className="text-sm text-gray-500">{new Date(creator.createdAt).toLocaleDateString()}</p>
          </div>
          {creator.creatorProfile?.approvalDate && (
            <div>
              <p className="text-sm font-medium">Status Updated:</p>
              <p className="text-sm text-gray-500">{new Date(creator.creatorProfile.approvalDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {creator.instagram && (
            <p className="text-sm">
              <span className="font-medium">Instagram:</span> {creator.instagram}
            </p>
          )}
          {creator.twitter && (
            <p className="text-sm">
              <span className="font-medium">Twitter:</span> {creator.twitter}
            </p>
          )}
          {creator.tiktok && (
            <p className="text-sm">
              <span className="font-medium">TikTok:</span> {creator.tiktok}
            </p>
          )}
          {creator.onlyfans && (
            <p className="text-sm">
              <span className="font-medium">OnlyFans:</span> {creator.onlyfans}
            </p>
          )}
        </div>

        {creator.creatorProfile?.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason:</p>
            <p className="text-sm text-red-700 dark:text-red-300">{creator.creatorProfile.rejectionReason}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => onViewContent(creator.id)}>
          View Content
        </Button>
        
        <div className="space-x-2">
          {creator.creatorProfile?.approvalStatus !== 'approved' && (
            <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-green-600 hover:bg-green-700">Approve</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Creator</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to approve this creator? They will be able to post content and be visible to followers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                  <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? 'Approving...' : 'Approve Creator'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {creator.creatorProfile?.approvalStatus !== 'rejected' && (
            <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Creator</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this creator. This will be visible to them.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
                    {isLoading ? 'Rejecting...' : 'Reject Creator'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
