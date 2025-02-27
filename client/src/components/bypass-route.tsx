import { ReactNode } from "react";

interface BypassRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

// Emergency bypass component that skips all authentication checks
export default function BypassRoute({ children }: BypassRouteProps) {
  // Simply render children without any authentication checks
  return <>{children}</>;
}
