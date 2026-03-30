import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, Menu, MessageSquareMore, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import ThemeToggle from '@/components/public/theme-toggle';

type SharedProps = {
  auth?: {
    user?: {
      name?: string | null;
      email?: string | null;
    } | null;
  };
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Events', href: '/events' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Tourism Office', href: '/tourism-office' },
  { label: 'Contact Us', href: '/contact' },
];

export default function PublicHeader() {
  const page = usePage<SharedProps>();
  const currentUrl = useMemo(() => page.url.split('?')[0], [page.url]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return currentUrl === '/';
    return currentUrl === href || currentUrl.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90]">
        <div className="public-container pt-4">
          <div className="glass-card hero-shadow flex items-center justify-between gap-4 rounded-[2rem] px-4 py-3 sm:px-5">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/marketing/images/logo/lightlogo.png"
                alt="BCCC EASE"
                className="h-12 w-auto object-contain dark:hidden"
              />
              <img
                src="/marketing/images/logo/darklogo.png"
                alt="BCCC EASE"
                className="hidden h-12 w-auto object-contain dark:block"
              />
            </Link>

            <nav className="hidden items-center gap-1 xl:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive(item.href)
                      ? 'bg-[#0f8b6d] text-white shadow-sm dark:bg-[#294CFF]'
                      : 'text-slate-800 hover:bg-white/70 dark:text-white dark:hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 xl:flex">
              <ThemeToggle />

              <Link
                href="/bookings/create"
                className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
              >
                <CalendarDays className="h-4 w-4" />
                Book Your Event
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <MessageSquareMore className="h-4 w-4" />
                Inquire
              </Link>
            </div>

            <div className="flex items-center gap-2 xl:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/80 text-slate-800 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <Link
        href="/bookings/create"
        className="fixed right-4 top-24 z-[80] hidden rounded-b-[1.5rem] rounded-t-md bg-[#0f8b6d] px-3 py-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-xl transition hover:translate-y-0.5 xl:block dark:bg-[#294CFF]"
      >
        Book
        <br />
        Your
        <br />
        Event
      </Link>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] xl:hidden">
          <div className="absolute inset-0 bg-slate-950/55" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[#f7f4ec] p-5 dark:bg-[#0f172a]">
            <div className="mb-6 flex items-center justify-between">
              <img
                src="/marketing/images/logo/lightlogo.png"
                alt="BCCC EASE"
                className="h-12 w-auto object-contain dark:hidden"
              />
              <img
                src="/marketing/images/logo/darklogo.png"
                alt="BCCC EASE"
                className="hidden h-12 w-auto object-contain dark:block"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive(item.href)
                      ? 'bg-[#0f8b6d] text-white dark:bg-[#294CFF]'
                      : 'bg-white text-slate-800 dark:bg-white/5 dark:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                href="/bookings/create"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white dark:bg-[#294CFF]"
              >
                <CalendarDays className="h-4 w-4" />
                Book Your Event
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/10"
              >
                <MessageSquareMore className="h-4 w-4" />
                Inquire
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
