export type RoleThemeKey = 'admin' | 'manager' | 'staff' | 'user';

export type RoleTheme = {
  key: RoleThemeKey;
  label: string;
  eyebrow: string;
  shellClass: string;
  heroClass: string;
  panelClass: string;
  cardClass: string;
  badgeClass: string;
  buttonClass: string;
  subtleButtonClass: string;
  textAccentClass: string;
};

export function normalizeRoleTheme(value?: string | null): RoleThemeKey {
  if (value === 'admin') return 'admin';
  if (value === 'manager') return 'manager';
  if (value === 'staff') return 'staff';
  return 'user';
}

const themes: Record<RoleThemeKey, RoleTheme> = {
  admin: {
    key: 'admin',
    label: 'Administrator',
    eyebrow: 'Executive Control',
    shellClass:
      'bg-[radial-gradient(circle_at_top_left,rgba(217,178,92,0.16),transparent_34%),linear-gradient(135deg,#070705_0%,#13110c_45%,#080806_100%)] text-stone-50',
    heroClass:
      'border-amber-200/15 bg-[linear-gradient(135deg,rgba(31,26,16,0.96),rgba(10,10,8,0.92))] shadow-black/30',
    panelClass:
      'border-amber-200/12 bg-white/[0.055] shadow-black/20',
    cardClass:
      'border-amber-200/12 bg-white/[0.06] shadow-black/20',
    badgeClass:
      'border-amber-200/25 bg-amber-300/10 text-amber-100',
    buttonClass:
      'border-amber-200/25 bg-amber-300/14 text-amber-50 hover:bg-amber-300/20',
    subtleButtonClass:
      'border-white/10 bg-white/8 text-white hover:bg-white/12',
    textAccentClass: 'text-amber-100',
  },

  manager: {
    key: 'manager',
    label: 'Manager',
    eyebrow: 'Review Workspace',
    shellClass:
      'bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_34%),linear-gradient(135deg,#06111f_0%,#0f172a_50%,#070a12_100%)] text-slate-50',
    heroClass:
      'border-sky-200/15 bg-[linear-gradient(135deg,rgba(15,35,62,0.96),rgba(8,14,28,0.92))] shadow-black/30',
    panelClass:
      'border-sky-200/12 bg-white/[0.055] shadow-black/20',
    cardClass:
      'border-sky-200/12 bg-white/[0.06] shadow-black/20',
    badgeClass:
      'border-sky-200/25 bg-sky-300/10 text-sky-100',
    buttonClass:
      'border-sky-200/25 bg-sky-300/14 text-sky-50 hover:bg-sky-300/20',
    subtleButtonClass:
      'border-white/10 bg-white/8 text-white hover:bg-white/12',
    textAccentClass: 'text-sky-100',
  },

  staff: {
    key: 'staff',
    label: 'Staff',
    eyebrow: 'Operations Desk',
    shellClass:
      'bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_34%),linear-gradient(135deg,#041610_0%,#052e25_48%,#06100d_100%)] text-emerald-50',
    heroClass:
      'border-emerald-200/15 bg-[linear-gradient(135deg,rgba(7,50,40,0.96),rgba(4,20,15,0.92))] shadow-black/30',
    panelClass:
      'border-emerald-200/12 bg-white/[0.055] shadow-black/20',
    cardClass:
      'border-emerald-200/12 bg-white/[0.06] shadow-black/20',
    badgeClass:
      'border-emerald-200/25 bg-emerald-300/10 text-emerald-100',
    buttonClass:
      'border-emerald-200/25 bg-emerald-300/14 text-emerald-50 hover:bg-emerald-300/20',
    subtleButtonClass:
      'border-white/10 bg-white/8 text-white hover:bg-white/12',
    textAccentClass: 'text-emerald-100',
  },

  user: {
    key: 'user',
    label: 'Client',
    eyebrow: 'Client Portal',
    shellClass:
      'bg-[radial-gradient(circle_at_top_left,rgba(180,83,9,0.12),transparent_34%),linear-gradient(135deg,#f8f3e8_0%,#efe5d0_48%,#fbfaf7_100%)] text-stone-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(217,178,92,0.14),transparent_34%),linear-gradient(135deg,#100f0c_0%,#1c1917_48%,#0c0a09_100%)] dark:text-stone-50',
    heroClass:
      'border-amber-900/10 bg-white/80 shadow-stone-900/10 dark:border-amber-200/12 dark:bg-white/[0.055] dark:shadow-black/30',
    panelClass:
      'border-stone-900/10 bg-white/75 shadow-stone-900/10 dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20',
    cardClass:
      'border-stone-900/10 bg-white/80 shadow-stone-900/10 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20',
    badgeClass:
      'border-amber-700/20 bg-amber-700/10 text-amber-900 dark:border-amber-200/25 dark:bg-amber-300/10 dark:text-amber-100',
    buttonClass:
      'border-amber-700/25 bg-amber-800 text-white hover:bg-amber-700 dark:border-amber-200/25 dark:bg-amber-300/14 dark:text-amber-50 dark:hover:bg-amber-300/20',
    subtleButtonClass:
      'border-stone-900/10 bg-white/70 text-stone-900 hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/12',
    textAccentClass: 'text-amber-900 dark:text-amber-100',
  },
};

export function getRoleTheme(role?: string | null): RoleTheme {
  return themes[normalizeRoleTheme(role)];
}
