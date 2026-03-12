import { Search, Bell, Settings, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { radius, transition, colors, focus, glass, semantic } from '../../lib/design-tokens';

interface DashboardHeaderProps {
  /** Salon name to display */
  salonName?: string;
  /** User name to display in avatar */
  userName?: string;
  /** Callback for menu button click */
  onMenuClick?: () => void;
  /** Callback for settings click */
  onSettingsClick?: () => void;
  /** Notification count badge */
  notificationCount?: number;
  className?: string;
}

export function DashboardHeader({
  salonName = 'Salon',
  userName = 'User',
  onMenuClick,
  onSettingsClick,
  notificationCount = 0,
  className
}: DashboardHeaderProps) {
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn('flex items-center justify-between gap-4', className)}
      role="banner"
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className={cn(
          'flex items-center justify-center',
          'lg:hidden',
          radius.md,
          glass.subtle,
          'p-2 text-zinc-400',
          transition.default,
          focus.default
        )}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search bar */}
      <div className="relative flex-1 max-w-md">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" 
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search clients, appointments..."
          className={cn(
            'w-full',
            radius.full,
            glass.subtle,
            'py-2 pl-10 pr-4',
            'text-sm text-white',
            'placeholder:text-zinc-600',
            transition.default,
            focus.default
          )}
          aria-label="Search clients, appointments"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Settings button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="relative"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Notifications button */}
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span 
              className={cn(
                'absolute -top-1 -right-1',
                'flex h-4 w-4 items-center justify-center',
                radius.full,
                'bg-emerald-500 text-[10px] font-bold text-white'
              )}
              aria-hidden="true"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>

        {/* User avatar */}
        <div
          className={cn(
            'h-8 w-8',
            radius.full,
            'bg-gradient-to-br from-emerald-500 to-blue-600',
            'flex items-center justify-center',
            'text-xs font-bold text-white'
          )}
          role="img"
          aria-label={`User: ${userName}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
