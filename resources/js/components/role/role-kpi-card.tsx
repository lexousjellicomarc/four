import type { LucideIcon } from 'lucide-react';

type RoleKpiCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: 'admin' | 'manager' | 'staff' | 'user' | 'neutral';
};

const toneClasses = {
  admin: {
    shell: 'border-amber-300/20 bg-amber-300/[0.07] text-amber-100',
    icon: 'bg-amber-300/12 text-amber-100',
    value: 'text-amber-50',
    description: 'text-amber-100/65',
  },
  manager: {
    shell: 'border-sky-300/20 bg-sky-300/[0.07] text-sky-100',
    icon: 'bg-sky-300/12 text-sky-100',
    value: 'text-sky-50',
    description: 'text-sky-100/65',
  },
  staff: {
    shell: 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100',
    icon: 'bg-emerald-300/12 text-emerald-100',
    value: 'text-emerald-50',
    description: 'text-emerald-100/65',
  },
  user: {
    shell:
      'border-yellow-700/20 bg-yellow-600/[0.07] text-stone-900 dark:border-yellow-300/20 dark:text-yellow-100',
    icon: 'bg-yellow-600/12 text-yellow-800 dark:text-yellow-100',
    value: 'text-stone-950 dark:text-yellow-50',
    description: 'text-stone-600 dark:text-yellow-100/65',
  },
  neutral: {
    shell: 'border-border bg-card text-card-foreground',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
    description: 'text-muted-foreground',
  },
};

export function RoleKpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
}: RoleKpiCardProps) {
  const classes = toneClasses[tone];

  return (
    <div className={`bccc-hover-lift group relative overflow-hidden rounded-3xl border p-5 shadow-sm backdrop-blur transition duration-300 ${classes.shell}`}>
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-current opacity-[0.055] blur-2xl transition duration-500 group-hover:scale-125" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current/25 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-75">
            {title}
          </p>

          <p className={`text-3xl font-black tracking-tight sm:text-4xl ${classes.value}`}>
            {value}
          </p>

          {description ? (
            <p className={`max-w-xs text-sm leading-relaxed ${classes.description}`}>
              {description}
            </p>
          ) : null}
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${classes.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
