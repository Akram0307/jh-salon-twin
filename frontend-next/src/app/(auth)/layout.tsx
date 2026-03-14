import { ReactNode } from 'react';
import { AuthErrorBoundary } from '@/components/error/AuthErrorBoundary';

// ============================================
// Auth Layout
// ============================================

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Optional: Add a subtle background pattern or logo */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        {/* Main content */}
        <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SalonOS. All rights reserved.</p>
          <p className="mt-1">Powered by AI-native revenue operating system</p>
        </footer>
      </div>
    </AuthErrorBoundary>
  );
}
