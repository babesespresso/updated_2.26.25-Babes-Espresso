import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertModelSchema, type InsertModel } from "@/../../shared/schema";
import { API_BASE_URL } from '@/lib/config';
import { apiRequest } from '@/lib/api';
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { ImageUpload } from "../components/ui/image-upload";
import { Link } from "react-router-dom"; 
import logo from "/logo.png";
import { ChevronLeft } from "lucide-react";
import { useState } from 'react';

const SOCIAL_PLATFORMS = [
  "Instagram",
  "Facebook",
  "X",
  "TikTok",
  "SnapChat",
  "Threads",
];

export default function ModelIntake() {
  const { toast } = useToast();

  const BackButton = () => (
    <Link to="/" className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
      <ChevronLeft className="h-6 w-6" />
    </Link>
  );

  const form = useForm<InsertModel>({
    resolver: zodResolver(insertModelSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      aliasName: '',
      socialPlatforms: [],
      socialHandles: '',
      onlyFansLink: '',
      termsAccepted: [false, false],
      bodyPhoto: undefined,
      licensePhoto: undefined,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  const onSubmit = async (data: InsertModel) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setIsSubmitSuccess(false);
    
    try {
      const formData = new FormData();

      // Handle date
      const dateOfBirth = data.dateOfBirth;
      formData.append('dateOfBirth', dateOfBirth);

      // Handle text fields
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('aliasName', data.aliasName || '');

      // Handle files
      if (data.bodyPhoto && data.bodyPhoto.length > 0) {
        formData.append('bodyPhoto', data.bodyPhoto[0]);
      }

      if (data.licensePhoto && data.licensePhoto.length > 0) {
        formData.append('licensePhoto', data.licensePhoto[0]);
      }

      // Handle arrays and objects
      formData.append('socialPlatforms', JSON.stringify(data.socialPlatforms || []));
      formData.append('socialHandles', data.socialHandles || '');
      formData.append('onlyFansLink', data.onlyFansLink || '');
      formData.append('termsAccepted', JSON.stringify(data.termsAccepted || []));

      // Submit the form data
      console.log('Submitting model application...');
      await apiRequest('/api/model-application', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type here, it will be set automatically for FormData
        }
      }, 20000); // 20 second timeout for uploads
      
      console.log('Model application submitted successfully');
      
      // Show success message and reset form
      setIsSubmitSuccess(true);
      toast({
        title: "Success!",
        description: "Your application has been submitted.",
      });
      form.reset();
      
    } catch (error) {
      console.error('Error submitting model application:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 relative">
      <BackButton />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="Babes Espresso Logo"
              className="h-28 w-auto"
            />
          </div>
          <CardTitle className="text-center">
            Welcome! 👋
          </CardTitle>
          <p className="text-center text-muted-foreground mt-2">
            We are looking to work with professional models who are skilled in digital platform marketing,
            have flexible schedules for photoshoots, and are comfortable creating engaging, sellable content.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              encType="multipart/form-data"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aliasName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias Model Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mercedes" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="socialPlatforms"
                render={() => (
                  <FormItem>
                    <FormLabel>Social Media Platforms</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <FormField
                          key={platform}
                          control={form.control}
                          name="socialPlatforms"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={Array.isArray(field.value) && field.value.includes(platform)}
                                  onCheckedChange={(checked) => {
                                    const updated = checked
                                      ? [...field.value, platform]
                                      : field.value?.filter((p) => p !== platform);
                                    field.onChange(updated);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {platform}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialHandles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Media Handles</FormLabel>
                    <FormControl>
                      <Input placeholder="@tag" {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onlyFansLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OnlyFans Link (or similar)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bodyPhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Body Picture</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          label="Upload full body photo"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licensePhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver's License (front)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          label="Upload license photo"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <div className="space-y-4">
                    <FormItem className="flex items-start space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value[0]}
                          onCheckedChange={(checked) => {
                            const newValue = [...field.value];
                            newValue[0] = checked as boolean;
                            field.onChange(newValue);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal leading-tight">
                        I agree to terms & conditions provided by the company. By providing my phone number,
                        I agree to receive text messages from the business.
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-start space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value[1]}
                          onCheckedChange={(checked) => {
                            const newValue = [...field.value];
                            newValue[1] = checked as boolean;
                            field.onChange(newValue);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal leading-tight">
                        I Consent to Receive SMS Notifications, Alerts & Occasional Marketing Communication from company.
                        Message frequency varies. Message & data rates may apply. Text HELP to +1 844-554-1928 for assistance.
                        You can reply STOP to unsubscribe at any time.
                      </FormLabel>
                    </FormItem>
                  </div>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </Form>
          <div className="text-center mt-4 text-sm text-muted-foreground"> 
            <Link to="/admin" className="hover:underline">
              Admin Dashboard
            </Link>
          </div> 
        </CardContent>
      </Card>
    </div>
  );
}