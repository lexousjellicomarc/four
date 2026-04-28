import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

type RoleActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone?: 'admin' | 'manager' | 'staff' | 'user' | 'neutral';
};

const toneClasses = {
  admin: {
    shell:
      'border-slate-800 bg-slate-900/75 text-slate-100 hover:border-amber-300/40 hover:bg-slate-900',
    icon: 'bg-amber-300/10 text-amber-200',
    arrow: 'text-amber-200',
    description: 'text-slate-400',
  },
  manager: {
    shell:
      'border-blue-800 bg-blue-900/75 text-blue-50 hover:border-sky-300/40 hover:bg-blue-900',
    icon: 'bg-sky-300/10 text-sky-200',
    arrow: 'text-sky-200',
    description: 'text-blue-200/70',
  },
  staff: {
    shell:
      'border-emerald-800 bg-emerald-900/75 text-emerald-50 hover:border-emerald-300/40 hover:bg-emerald-900',
    icon: 'bg-emerald-300/10 text-emerald-200',
    arrow: 'text-emerald-200',
    description: 'text-emerald-100/70',
  },
  user: {
    shell:
      'border-stone-200 bg-white text-stone-950 hover:border-yellow-700/30 hover:bg-yellow-50/40 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:hover:border-yellow-300/30',
    icon: 'bg-yellow-600/10 text-yellow-800 dark:text-yellow-200',
    arrow: 'text-yellow-800 dark:text-yellow-200',
    description: 'text-stone-600 dark:text-stone-400',
  },
  neutral: {
    shell: 'border-border bg-card text-card-foreground hover:bg-muted/30',
    icon: 'bg-muted text-muted-foreground',
    arrow: 'text-muted-foreground',
    description: 'text-muted-foreground',
  },
};

export function RoleActionCard({
  title,
  description,
  href,
  icon: Icon,
  tone = 'neutral',
}: RoleActionCardProps) {
  const classes = toneClasses[tone];

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl border p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${classes.shell}`}
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-current opacity-[0.035] transition group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${classes.icon}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-bold tracking-tight">{title}</h3>
            <p className={`text-sm leading-relaxed ${classes.description}`}>
              {description}
            </p>
          </div>
        </div>

        <ArrowUpRight className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${classes.arrow}`} />
      </div>
    </Link>
  );
}
