import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, Menu, PhoneCall, X } from 'lucide-react';
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

const leftNavItems = [
  { label: 'Home', href: '/' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Events', href: '/events' },
  { label: 'Calendar', href: '/calendar' },
];

const rightNavItems = [
  { label: 'Tourism Office', href: '/tourism-office' },
  { label: 'Contact', href: '/contact' },
];

const allNavItems = [...leftNavItems, ...rightNavItems];

export default function PublicHeader() {
  const page = usePage<SharedProps>();
  const currentUrl = useMemo(() => page.url.split('?')[0], [page.url]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return currentUrl === '/';
    return currentUrl === href || currentUrl.startsWith(`${href}/`);
  };

  const navClass = (href: string) =>
    `rounded-full px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.16em] transition lg:text-[14px] ${
      isActive(href)
        ? 'bg-white/18 text-white shadow-[0_8px_22px_rgba(15,23,42,0.15)]'
        : 'text-white/90 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100]">
        <div className="w-full border-b border-white/10 bg-[linear-gradient(135deg,rgba(14,26,45,0.86),rgba(15,139,109,0.36))] shadow-[0_24px_70px_rgba(15,23,42,0.26)] backdrop-blur-xl dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.94),rgba(41,76,255,0.26))] dark:shadow-[0_24px_70px_rgba(2,8,23,0.48)]">
          <div className="relative flex min-h-[88px] w-full items-center justify-between gap-4 pl-3 pr-[118px] sm:pl-4 lg:min-h-[96px] lg:pl-5 lg:pr-[136px]">
            <div className="flex min-w-0 items-center gap-4 lg:gap-6">
              <Link href="/" className="shrink-0">
                <img
                  src="/marketing/images/logo/lightlogo.png"
                  alt="BCCC EASE"
                  className="h-12 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)] dark:hidden sm:h-14"
                />
                <img
                  src="/marketing/images/logo/darklogo.png"
                  alt="BCCC EASE"
                  className="hidden h-12 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.28)] dark:block sm:h-14"
                />
              </Link>

              <nav className="hidden items-center gap-1 xl:flex">
                {leftNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className={navClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="hidden items-center gap-2 pr-8 xl:flex">
              {rightNavItems.map((item) => (
                <Link key={item.href} href={item.href} className={navClass(item.href)}>
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
            </div>

            <Link
              href="/bookings/create"
              className="absolute right-0 top-0 z-[110] hidden h-[116px] w-[118px] flex-col items-center justify-center gap-2 bg-[#0f8b6d] px-4 text-center text-[12px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_22px_55px_rgba(15,139,109,0.36)] transition hover:opacity-95 dark:bg-[#294CFF] dark:shadow-[0_22px_55px_rgba(41,76,255,0.34)] xl:flex lg:h-[122px] lg:w-[136px]"
            >
              <CalendarDays className="h-5 w-5" />
              <span className="leading-tight">
                Book
                <br />
                Your
                <br />
                Event
              </span>
            </Link>

            <div className="flex items-center gap-2 pr-3 sm:pr-4 xl:hidden">
              <ThemeToggle />

              <Link
                href="/bookings/create"
                className="hidden items-center gap-2 rounded-full bg-[#0f8b6d] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white dark:bg-[#294CFF] sm:inline-flex"
              >
                <CalendarDays className="h-4 w-4" />
                Book
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[120] xl:hidden">
          <div className="absolute inset-0 bg-slate-950/68 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[#f7f4ec] p-5 dark:bg-[#0b1220]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <img src="/marketing/images/logo/lightlogo.png" alt="BCCC EASE" className="h-12 w-auto object-contain dark:hidden" />
              <img src="/marketing/images/logo/darklogo.png" alt="BCCC EASE" className="hidden h-12 w-auto object-contain dark:block" />

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
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-[1.2rem] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition ${
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
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-[#0f8b6d] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white dark:bg-[#294CFF]"
              >
                <CalendarDays className="h-4 w-4" />
                Book Your Event
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-black/10 px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-white/10 dark:text-white"
              >
                <PhoneCall className="h-4 w-4" />
                Contact Office
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
