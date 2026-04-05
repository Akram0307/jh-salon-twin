/**
 * SalonOS Error Fallback UI
 * User-friendly error display with recovery options
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again or return to the dashboard.
          </CardDescription>
        </CardHeader>

        {isDev && error && (
          <CardContent>
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground">Error Details (Dev Mode):</p>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-destructive">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        )}

        <CardFooter className="flex justify-center gap-3">
          {resetError && (
            <Button
              variant="outline"
              onClick={resetError}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button asChild className="gap-2">
            <Link href="/owner/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ErrorFallback;
