import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout';

type UserRole = 'creator' | 'follower';

interface AuthFormData {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  role: UserRole;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    role: 'follower'
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      toast({
        title: isLogin ? 'Login Successful' : 'Registration Successful',
        description: data.message
      });

      // Redirect based on role
      // Use the redirectTo URL from the server response
      navigate(data.redirectTo);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: 'destructive'
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? 'Login' : 'Create Account'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to your account' 
                : 'Join our community as a creator or follower'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <Tabs 
                  defaultValue="follower" 
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="follower">Follower</TabsTrigger>
                    <TabsTrigger value="creator">Creator</TabsTrigger>
                  </TabsList>
                  <TabsContent value="follower">
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow your favorite creators and access exclusive content
                    </p>
                  </TabsContent>
                  <TabsContent value="creator">
                    <p className="text-sm text-muted-foreground mb-4">
                      Share your content and build your following
                    </p>
                  </TabsContent>
                </Tabs>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Choose a unique username"
                  />
                </div>
              )}

              {!isLogin && formData.role === 'creator' && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your public display name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({
                    email: '',
                    password: '',
                    role: 'follower'
                  });
                }}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
