import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

/**
 * Dashboard components that were previously in the admin dashboard
 * These are provided as reference for future implementation
 */

export const NewSignupsCard = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">New Signups</CardTitle>
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">128</div>
        <p className="text-xs text-muted-foreground">+22% from last month</p>
      </CardContent>
    </Card>
  );
};

export const FlaggedContentCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Content</CardTitle>
        <CardDescription>Content that requires review</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-xs font-medium text-red-600">!</span>
              </div>
              <div>
                <p className="text-sm font-medium">Inappropriate content</p>
                <p className="text-xs text-muted-foreground">Reported by 3 users</p>
              </div>
            </div>
            <Button size="sm" variant="outline">Review</Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-xs font-medium text-yellow-600">!</span>
              </div>
              <div>
                <p className="text-sm font-medium">Potential copyright issue</p>
                <p className="text-xs text-muted-foreground">Reported by 1 user</p>
              </div>
            </div>
            <Button size="sm" variant="outline">Review</Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-xs font-medium text-orange-600">!</span>
              </div>
              <div>
                <p className="text-sm font-medium">Age verification concern</p>
                <p className="text-xs text-muted-foreground">System flagged</p>
              </div>
            </div>
            <Button size="sm" variant="outline">Review</Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View All Flagged Content</Button>
      </CardFooter>
    </Card>
  );
};

export const ContentApprovalCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Approval Queue</CardTitle>
        <CardDescription>New content waiting for approval</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded bg-gray-200 overflow-hidden">
                <img 
                  src="https://placehold.co/100x100?text=Image" 
                  alt="Content thumbnail" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium">Summer photoshoot</p>
                <p className="text-xs text-muted-foreground">Submitted 2 hours ago</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="destructive">Reject</Button>
              <Button size="sm">Approve</Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded bg-gray-200 overflow-hidden">
                <img 
                  src="https://placehold.co/100x100?text=Image" 
                  alt="Content thumbnail" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium">Beach day collection</p>
                <p className="text-xs text-muted-foreground">Submitted 5 hours ago</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="destructive">Reject</Button>
              <Button size="sm">Approve</Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View All Pending Content</Button>
      </CardFooter>
    </Card>
  );
};

export const SubscriptionMetricsCard = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscription Metrics</CardTitle>
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
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Active Subscriptions</span>
            <span className="text-sm font-medium">842</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">New This Month</span>
            <span className="text-sm font-medium">+156</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Cancellations</span>
            <span className="text-sm font-medium">-24</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Renewal Rate</span>
            <span className="text-sm font-medium">87%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CreatorApplicationsCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Creator Applications</CardTitle>
        <CardDescription>New creator applications pending review</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium">Jessica Davis</p>
                <p className="text-xs text-muted-foreground">Applied 1 day ago</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="destructive">Reject</Button>
              <Button size="sm">Approve</Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium">MR</span>
              </div>
              <div>
                <p className="text-sm font-medium">Michael Robinson</p>
                <p className="text-xs text-muted-foreground">Applied 2 days ago</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="destructive">Reject</Button>
              <Button size="sm">Approve</Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View All Applications</Button>
      </CardFooter>
    </Card>
  );
};

export const RevenueBreakdownCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
        <CardDescription>Monthly revenue by source</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Subscriptions</span>
            </div>
            <span className="text-sm font-medium">$18,245.65</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">One-time Purchases</span>
            </div>
            <span className="text-sm font-medium">$4,320.13</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm">Tips & Donations</span>
            </div>
            <span className="text-sm font-medium">$2,000.00</span>
          </div>
        </div>
        <div className="h-4 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
          <div className="flex h-full">
            <div className="bg-blue-500 h-full" style={{ width: '74%' }}></div>
            <div className="bg-green-500 h-full" style={{ width: '18%' }}></div>
            <div className="bg-purple-500 h-full" style={{ width: '8%' }}></div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Total: $24,565.78</p>
      </CardContent>
    </Card>
  );
};

export const UserActivityCard = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">User Activity</CardTitle>
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Daily Active Users</span>
            <span className="text-sm font-medium">2,458</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Weekly Active Users</span>
            <span className="text-sm font-medium">8,721</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Monthly Active Users</span>
            <span className="text-sm font-medium">15,432</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Avg. Session Duration</span>
            <span className="text-sm font-medium">12m 34s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ContentPerformanceCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Content</CardTitle>
        <CardDescription>Most viewed and engaged content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded bg-gray-200 overflow-hidden">
              <img 
                src="https://placehold.co/100x100?text=1" 
                alt="Content thumbnail" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Summer Collection 2025</p>
              <div className="flex space-x-2 text-xs text-muted-foreground">
                <span>12.5k views</span>
                <span>•</span>
                <span>856 likes</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded bg-gray-200 overflow-hidden">
              <img 
                src="https://placehold.co/100x100?text=2" 
                alt="Content thumbnail" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Beach Photoshoot</p>
              <div className="flex space-x-2 text-xs text-muted-foreground">
                <span>8.3k views</span>
                <span>•</span>
                <span>624 likes</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded bg-gray-200 overflow-hidden">
              <img 
                src="https://placehold.co/100x100?text=3" 
                alt="Content thumbnail" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Coffee Shop Series</p>
              <div className="flex space-x-2 text-xs text-muted-foreground">
                <span>7.1k views</span>
                <span>•</span>
                <span>512 likes</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View Content Analytics</Button>
      </CardFooter>
    </Card>
  );
};

export const SystemHealthCard = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Server Uptime</span>
            <span className="text-sm font-medium text-green-500">99.98%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">API Response Time</span>
            <span className="text-sm font-medium">124ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Storage Usage</span>
            <span className="text-sm font-medium">68%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Error Rate (24h)</span>
            <span className="text-sm font-medium text-green-500">0.02%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard layout example showing how to use these components
export const DashboardExample = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NewSignupsCard />
        <SubscriptionMetricsCard />
        <UserActivityCard />
        <SystemHealthCard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FlaggedContentCard />
        <ContentApprovalCard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CreatorApplicationsCard />
        <ContentPerformanceCard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <RevenueBreakdownCard />
      </div>
    </div>
  );
};
