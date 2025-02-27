import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      try {
        const response = await apiRequest<{ message: string; user: { id: number; email: string; role: string }; redirectTo: string }>("POST", "/api/auth/login", data);
        return response;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      try {
        // Show success message
        toast({
          title: "Success",
          description: data.message || "Logged in successfully",
        });

        // Wait longer for the session to be fully established
        // This helps prevent issues with session not being ready when redirecting
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Clear any existing session data in localStorage to prevent conflicts
        try {
          localStorage.removeItem('lastAuthError');
          localStorage.setItem('authSuccess', Date.now().toString());
        } catch (e) {
          console.warn('Failed to update localStorage:', e);
          // Continue even if localStorage fails
        }

        // Redirect based on role
        if (data.redirectTo) {
          navigate(data.redirectTo);
        } else {
          navigate(data.user.role === 'admin' ? '/admin' : '/gallery');
        }
      } catch (error) {
        console.error('Post-login error:', error);
        
        // Store the error in localStorage for debugging
        try {
          localStorage.setItem('lastAuthError', JSON.stringify({
            time: Date.now(),
            message: error instanceof Error ? error.message : 'Unknown error',
          }));
        } catch (e) {
          console.warn('Failed to store error in localStorage:', e);
        }
        
        toast({
          title: "Error",
          description: "Login successful but redirect failed. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
      
      // Store the error in localStorage for debugging
      try {
        localStorage.setItem('lastAuthError', JSON.stringify({
          time: Date.now(),
          message: error instanceof Error ? error.message : 'Unknown error',
        }));
      } catch (e) {
        console.warn('Failed to store error in localStorage:', e);
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? 
          error.message.includes('401') ? "Invalid email or password" : error.message 
          : "Login failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} autoComplete="current-password" 
                          {...field} 
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full text-white"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Logging in..." : "Login"}
              </Button>
              <div className="text-sm text-center mt-4">
                <span className="text-white">Don't have an account?{" "}</span>
                <Link href="/signup" className="text-white font-semibold hover:underline">
                  Sign Up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}