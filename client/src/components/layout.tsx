import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 w-full bg-black backdrop-blur-sm z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link to="/">
            <img src="/logo.png" alt="Logo" className="h-10 hover:opacity-80 transition-opacity" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex space-x-4">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Home
                </Button>
              </Link>
              <Link to="/gallery">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Gallery
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  About
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Contact
                </Button>
              </Link>
              <Link to="/premium">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Premium
                </Button>
              </Link>
            </div>

            <div className="flex space-x-4">
              <Link to="/model-intake">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Model Application
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="ml-4">
                <Menu className="h-6 w-6 text-white" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[300px] sm:w-[350px] bg-black/95 border-white/10 p-0"
              title="Navigation Menu"
              description="Main navigation links and actions"
            >
              <nav className="flex flex-col py-6">
                <div className="px-6 space-y-1">
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Link to="/">Home</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Link to="/gallery">Gallery</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Link to="/about">About</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Link to="/contact">Contact</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Link to="/premium">Premium</Link>
                  </Button>
                </div>
                <div className="px-6 mt-6 pt-6 border-t border-white/10">
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Link to="/model-intake">Model Application</Link>
                    </Button>
                    <Button
                      variant="secondary"
                      asChild
                      size="lg"
                      className="w-full"
                    >
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {children}
    </div>
  );
}
