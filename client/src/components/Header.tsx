import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-white/10 bg-black/90 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <img src="/logo.png" alt="Babes Espresso" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-white/60 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/model-application" className="text-white/60 hover:text-white transition-colors">
              Model Application
            </Link>
            <Link to="/gallery" className="text-white/60 hover:text-white transition-colors">
              Gallery
            </Link>
            <Link to="/premium" className="text-white/60 hover:text-white transition-colors">
              18+ Content
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/auth" className="text-white/60 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/signup">
              <Button variant="secondary" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6 text-white" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black/95 border-white/10">
              <nav className="flex flex-col space-y-4 mt-8">
                <Link to="/" className="text-white/60 hover:text-white transition-colors px-4 py-2">
                  Home
                </Link>
                <Link to="/model-application" className="text-white/60 hover:text-white transition-colors px-4 py-2">
                  Model Application
                </Link>
                <Link to="/gallery" className="text-white/60 hover:text-white transition-colors px-4 py-2">
                  Gallery
                </Link>
                <Link to="/premium" className="text-white/60 hover:text-white transition-colors px-4 py-2">
                  18+ Content
                </Link>
                <div className="border-t border-white/10 mt-4 pt-4">
                  <Link to="/auth" className="text-white/60 hover:text-white transition-colors px-4 py-2 block">
                    Sign In
                  </Link>
                  <Link to="/signup" className="px-4 py-2 block">
                    <Button variant="secondary" size="sm" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
