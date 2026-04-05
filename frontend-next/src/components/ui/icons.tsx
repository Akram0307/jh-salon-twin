import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Copy,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  File,
  HelpCircle,
  Home,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SunMedium,
  Trash,
  User,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c1.5 0 2.5 2 2.5 2s1 2 1 3.5c0 1.5 -.5 2.5 -.5 2.5" />
      <path d="M12 3c-1.5 0 -2.5 2 -2.5 2s-1 2 -1 3.5c0 1.5 .5 2.5 .5 2.5" />
      <path d="M9 12l6 0" />
      <path d="M12 9l0 6" />
    </svg>
  ),
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  trash: Trash,
  post: File,
  page: File,
  media: File,
  settings: Settings,
  billing: CreditCard,
  ellipsis: MoreHorizontal,
  add: Plus,
  warning: AlertCircle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  sun: SunMedium,
  moon: Moon,
  laptop: Home,
  check: Check,
  copy: Copy,
  circle: Circle,
  search: Search,
  edit: Edit,
  menu: Menu,
  logout: LogOut,
  lock: Lock,
  mail: Mail,
  eye: Eye,
  eyeOff: EyeOff,
  alertCircle: AlertCircle,
};
