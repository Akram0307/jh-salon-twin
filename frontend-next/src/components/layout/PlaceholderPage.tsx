import { cn } from '@/lib/utils';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      {Icon && (
        <div className="rounded-full p-4 bg-[oklch(0.16_0.010_264)]">
          <Icon className="h-8 w-8 text-[oklch(0.70_0.008_264)]" />
        </div>
      )}
      <h1 className="text-2xl font-semibold text-[oklch(0.95_0.005_264)]">
        {title}
      </h1>
      {description && (
        <p className="text-center max-w-md text-[oklch(0.70_0.008_264)]">
          {description}
        </p>
      )}
      <div className="mt-4">
        <div className="rounded-lg px-4 py-2 text-sm bg-[oklch(0.16_0.010_264)] text-[oklch(0.50_0.005_264)]">
          Coming soon
        </div>
      </div>
    </div>
  );
}
