import { OwnerShell } from '@/components/layout/OwnerShell';
import { OwnerErrorBoundary } from '@/components/error/OwnerErrorBoundary';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnerErrorBoundary>
      <OwnerShell>{children}</OwnerShell>
    </OwnerErrorBoundary>
  );
}
