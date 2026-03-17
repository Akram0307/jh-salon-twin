"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icons } from '@/components/ui/icons';
import {
  Building2,
  Users,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';

// ============================================
// Portal Entry Cards
// ============================================

const portals = [
  {
    title: 'Owner HQ',
    description: 'Full operational command center — dashboard, scheduling, staff, revenue, and AI insights.',
    href: '/login',
    icon: Building2,
    gradient: 'from-violet-600/20 to-purple-600/20',
    border: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-400/60',
    badge: 'Primary',
  },
  {
    title: 'Staff Portal',
    description: 'Personal schedule, availability management, earnings tracking, and client history.',
    href: '/staff/schedule',
    icon: Users,
    gradient: 'from-blue-600/20 to-cyan-600/20',
    border: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-400/60',
    badge: 'Coming Soon',
  },
  {
    title: 'Client Chat',
    description: 'AI-powered booking assistant, appointment management, and real-time salon communication.',
    href: '/client/chat',
    icon: MessageCircle,
    gradient: 'from-emerald-600/20 to-teal-600/20',
    border: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-400/60',
    badge: 'Beta',
  },
];

const features = [
  { icon: Sparkles, label: 'AI-Native' },
  { icon: Shield, label: 'Enterprise Security' },
  { icon: Zap, label: 'Real-time Sync' },
];

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ============================================
// Root Page
// ============================================

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))" />

      {/* Main content */}
      <motion.div
        className="relative flex flex-1 flex-col items-center justify-center px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo & Heading */}
        <motion.div className="text-center mb-10" variants={itemVariants}>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Icons.logo className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            SalonOS
          </h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            AI-native revenue operating system for modern salons
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 border border-border/50 px-3 py-1 text-xs text-muted-foreground"
              >
                <f.icon className="h-3 w-3" />
                {f.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Portal Cards */}
        <div className="grid w-full max-w-3xl gap-4 sm:gap-6">
          {portals.map((portal) => (
            <motion.div key={portal.title} variants={itemVariants}>
              <Link
                href={portal.href}
                className={`group block rounded-xl border ${portal.border} ${portal.hoverBorder} bg-gradient-to-br ${portal.gradient} backdrop-blur-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-black/20`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/50 border border-border/50">
                      <portal.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">
                          {portal.title}
                        </h2>
                        {portal.badge !== 'Primary' && (
                          <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50">
                            {portal.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {portal.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-foreground mt-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p className="mt-10 text-xs text-muted-foreground/60" variants={itemVariants}>
          Select a portal to continue · Secure authentication required
        </motion.p>
      </motion.div>

      {/* Footer */}
      <footer className="relative text-center pb-4 text-xs text-muted-foreground/50">
        © {new Date().getFullYear()} SalonOS · AI-native revenue operating system
      </footer>
    </div>
  );
}
