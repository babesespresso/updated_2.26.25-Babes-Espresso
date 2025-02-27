import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertModelSchema, type InsertModel } from "@/../../shared/schema";
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { Textarea } from '../components/ui/textarea';

const SOCIAL_PLATFORMS = [
  "Instagram",
  "Facebook",
  "X",
  "TikTok",
  "SnapChat",
  "Threads",
];

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  displayName?: string;
  role: 'creator' | 'follower';
  // Creator specific fields
  age?: number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  experience?: string;
  instagram?: string;
  availability?: string;
  bodyPhotoUrl?: string;
  licensePhotoUrl?: string;
  // Fan specific fields
  bio?: string;
  interests?: string[];
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get role from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role');
  
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    role: (roleParam === 'creator' || roleParam === 'follower') ? roleParam : 'follower'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bodyPhotoFile, setBodyPhotoFile] = useState<File | null>(null);
  const [licensePhotoFile, setLicensePhotoFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File, type: 'body' | 'license') => {
    console.log('Uploading file:', { type, name: file.name, size: file.size });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/auth/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (!response.ok) {
        throw new Error(data.details || 'Upload failed');
      }

      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const modelForm = useForm<InsertModel>({
    resolver: zodResolver(insertModelSchema),
    defaultValues: {
      socialPlatforms: [],
      termsAccepted: [false, false],
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // For creators, handle file uploads first
      if (formData.role === 'creator') {
        if (!bodyPhotoFile || !licensePhotoFile) {
          throw new Error('Please upload both required photos');
        }

        // Upload files
        const [bodyPhotoUrl, licensePhotoUrl] = await Promise.all([
          handleFileUpload(bodyPhotoFile, 'body'),
          handleFileUpload(licensePhotoFile, 'license')
        ]);

        formData.bodyPhotoUrl = bodyPhotoUrl;
        formData.licensePhotoUrl = licensePhotoUrl;
      }

      // Submit registration
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        toast({
          title: 'Registration Successful',
          description: data.message
        });

        // Redirect based on role
        navigate(data.redirectTo || '/');
      } catch (fetchError) {
        console.error('Registration fetch error:', fetchError);
        
        // Check for extension interference
        if (fetchError instanceof Error && 
            (fetchError.message.includes('redacted') || 
             fetchError.stack?.includes('useUserExtension'))) {
          toast({
            title: 'Browser Extension Issue',
            description: 'A browser extension may be interfering with the registration process. Try disabling extensions or using incognito mode.',
            variant: 'destructive'
          });
        } else {
          throw fetchError; // Re-throw for the outer catch
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Registration failed',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 mt-16 md:mt-20">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Join our community as a creator or fan
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent>
              <Tabs
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'creator' | 'follower' }))}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="creator">Creator</TabsTrigger>
                  <TabsTrigger value="follower">Fan</TabsTrigger>
                </TabsList>

                <div className="space-y-6">
                  {/* Common Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        autoComplete="username"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>

                  <TabsContent value="creator" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...modelForm.register('firstName')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...modelForm.register('lastName')}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...modelForm.register('dateOfBirth')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aliasName">Alias Model Name</Label>
                        <Input
                          id="aliasName"
                          {...modelForm.register('aliasName')}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Social Media Platforms</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <div key={platform} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={platform}
                              value={platform}
                              {...modelForm.register('socialPlatforms')}
                            />
                            <Label htmlFor={platform}>{platform}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="socialHandles">Social Media Handles</Label>
                      <Textarea
                        id="socialHandles"
                        {...modelForm.register('socialHandles')}
                        placeholder="@username (one per line)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="onlyFansLink">OnlyFans Link (Optional)</Label>
                      <Input
                        id="onlyFansLink"
                        {...modelForm.register('onlyFansLink')}
                        placeholder="https://onlyfans.com/..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          required
                          value={formData.displayName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          required
                          min={18}
                          value={formData.age || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram Handle</Label>
                        <Input
                          id="instagram"
                          value={formData.instagram || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                          placeholder="@username"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          required
                          value={formData.city || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          required
                          value={formData.state || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          required
                          value={formData.zip || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability</Label>
                      <Textarea
                        id="availability"
                        required
                        value={formData.availability || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                        placeholder="Please list your general availability for work"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience</Label>
                      <Textarea
                        id="experience"
                        value={formData.experience || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="Tell us about any relevant experience"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bodyPhoto">Full Body Photo</Label>
                        <Input
                          id="bodyPhoto"
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => setBodyPhotoFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Please provide a recent full body photo
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="licensePhoto">Driver's License</Label>
                        <Input
                          id="licensePhoto"
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => setLicensePhotoFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload a photo of your driver's license for age verification
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="follower" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name (Optional)</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio (Optional)</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us a bit about yourself"
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/auth')}
              >
                Already have an account? Sign in
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
