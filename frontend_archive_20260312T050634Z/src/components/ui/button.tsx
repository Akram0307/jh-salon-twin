import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { radius, transition, focus, colors } from '../../lib/design-tokens';

type Variant = 'default' | 'outline' | 'secondary' | 'ghost' | 'emerald';
type Size = 'sm' | 'default' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  default: 'bg-white text-zinc-900 hover:bg-zinc-200',
  outline: 'border semantic.border.strong glass.subtle text-white hover:glass.default',
  secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
  ghost: 'bg-transparent text-white hover:glass.subtle',
  emerald: 'bg-emerald-500 text-white hover:bg-emerald-400 border border-emerald-400/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm',
  default: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const baseClasses = `inline-flex items-center justify-center gap-2 ${radius.md} font-medium ${transition.default} disabled:opacity-50 ${focus.default}`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
