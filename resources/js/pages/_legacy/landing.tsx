import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import bookingsRoutes from '@/routes/bookings';
import type { SharedData } from '@/types';

// ✅ Import your rectangle logo from this path:
// /resources/js/components/logo/logo.png
import logo from '@/components/logo/logo.png';

const servicesRoutes = {
  index: {
    url: () => '/services',
  },
};

export default function Landing() {
  const { auth } = usePage<SharedData>().props;
  const isAuthed = !!auth.user;

  return (
    <>
      <Head title="Event Booking System" />

      <div className="bcc-page relative min-h-screen flex flex-col text-neutral-900 dark:text-neutral-100 overflow-hidden">
        {/* Decorative dots (never blocks clicks) */}
        <div className="bcc-dots pointer-events-none absolute inset-0" aria-hidden="true" />

        {/* HEADER (same structure) */}
        <header className="sticky top-0 z-50 w-full">
          <div className="bcc-nav border-b">
            <div className="w-full px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="bcc-logo-dot" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="font-serif font-semibold tracking-wide text-lg leading-none bcc-text truncate">
                    Event Booking
                  </div>
                  <div className="text-[11px] bcc-muted truncate">Plan • Manage • Notify</div>
                </div>
              </Link>

              <nav className="flex items-center gap-2 text-sm">
                {isAuthed ? (
                  <>
                    <Link href={dashboard()} className="bcc-link rounded-xl px-4 py-2 font-medium">
                      Dashboard
                    </Link>
                    <Link href={servicesRoutes.index.url()} className="bcc-link rounded-xl px-4 py-2">
                      Services
                    </Link>
                    <Link href={bookingsRoutes.index.url()} className="bcc-link rounded-xl px-4 py-2">
                      Bookings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={login()} className="bcc-link rounded-xl px-4 py-2 font-medium">
                      Log in
                    </Link>
                    <Link
                      href={register()}
                      className="bcc-btn-primary inline-flex items-center rounded-xl px-4 py-2 font-medium shadow-sm"
                    >
                      Get Started
                      <span className="ml-2 bcc-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* HERO (same structure) */}
        <section className="relative px-6 py-10 md:py-20 flex flex-col items-center text-center">
          {/* hero overlay glow (does not block clicks) */}
          <div className="bcc-hero-overlay pointer-events-none absolute inset-0" aria-hidden="true" />

          <div className="relative z-10 w-full max-w-4xl">
            {/* Decorative line + dot */}
            <div className="mb-7 flex items-center justify-center gap-4">
              <div className="bcc-fade-line h-px w-16" aria-hidden="true" />
              <div className="bcc-dot h-2.5 w-2.5 rounded-full" aria-hidden="true" />
              <div className="bcc-fade-line bcc-fade-line--reverse h-px w-16" aria-hidden="true" />
            </div>

            {/* ✅ Bigger rectangle logo + description in hero */}
            <div className="mb-7 flex flex-col items-center">
              <div className="bcc-hero-logo-rect">
                <img
                  src={logo}
                  alt="Baguio Convention & Cultural Center"
                  className="bcc-hero-logo-rect__img"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 font-serif text-base sm:text-lg font-semibold bcc-text">
                Baguio Convention &amp; Cultural Center
              </div>
              <div className="text-[13px] sm:text-base bcc-muted">
                Events Access &amp; Scheduling Engine
              </div>
            </div>

            <h1 className="font-serif max-w-3xl mx-auto text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bcc-text">
              Plan, Manage &amp; Elevate Your Events
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl bcc-muted">
              A modern platform to build a service catalog, create multi-service bookings, and track
              statuses &amp; payments effortlessly.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {isAuthed ? (
                <>
                  <Link
                    href={bookingsRoutes.create.url()}
                    className="bcc-btn-primary inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium shadow-sm"
                  >
                    New Booking
                  </Link>

                  <Link
                    href={servicesRoutes.index.url()}
                    className="bcc-btn-outline inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium"
                  >
                    Browse Services
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={register()}
                    className="bcc-btn-primary inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium shadow-sm"
                  >
                    Create Account
                  </Link>

                  <Link
                    href={login()}
                    className="bcc-btn-outline inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>

            {/* Pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="bcc-pill inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                Role-based notifications
              </span>
              <span className="bcc-pill inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                Booking status tracking
              </span>
              <span className="bcc-pill inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                Payments monitoring
              </span>
            </div>
          </div>
        </section>

        {/* FOOTER (same structure) */}
        <footer className="mt-auto py-6 text-center text-xs bcc-muted">
          <p>
            &copy; {new Date().getFullYear()} Event Booking System. Built with Laravel, Inertia
            &amp; React.
          </p>
        </footer>

        {/* Styles inspired by Overview design (scoped to .bcc-page) */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

          .bcc-page {
            --bcc-bg: #F2E7C8;
            --bcc-surface: #FFF9EA;
            --bcc-border: #C6BA99;
            --bcc-text: #291D12;
            --bcc-muted: #634934;
            --bcc-accent: #634934;
            --bcc-accent-2: #473321;
            --bcc-accent-foreground: #F2E7C8;

            --bcc-bg-rgb: 242 231 200;
            --bcc-surface-rgb: 255 249 234;
            --bcc-border-rgb: 198 186 153;
            --bcc-text-rgb: 41 29 18;
            --bcc-muted-rgb: 99 73 52;
            --bcc-accent-rgb: 99 73 52;
            --bcc-accent-2-rgb: 71 51 33;
            --bcc-accent-foreground-rgb: 242 231 200;

            background:
              radial-gradient(1000px 520px at 10% -10%, rgb(var(--bcc-accent-rgb) / 0.10), transparent 60%),
              radial-gradient(900px 520px at 90% 0%, rgb(var(--bcc-accent-2-rgb) / 0.08), transparent 62%),
              radial-gradient(900px 520px at 50% 120%, rgb(var(--bcc-border-rgb) / 0.12), transparent 65%),
              linear-gradient(180deg, rgb(var(--bcc-bg-rgb) / 1), rgb(var(--bcc-bg-rgb) / 0.98));
          }

          .dark .bcc-page {
            --bcc-bg: #120E08;
            --bcc-surface: #291D12;
            --bcc-border: #473321;
            --bcc-text: #F2E7C8;
            --bcc-muted: #C6BA99;
            --bcc-accent: #F2E7C8;
            --bcc-accent-2: #C6BA99;
            --bcc-accent-foreground: #120E08;

            --bcc-bg-rgb: 18 14 8;
            --bcc-surface-rgb: 41 29 18;
            --bcc-border-rgb: 71 51 33;
            --bcc-text-rgb: 242 231 200;
            --bcc-muted-rgb: 198 186 153;
            --bcc-accent-rgb: 242 231 200;
            --bcc-accent-2-rgb: 198 186 153;
            --bcc-accent-foreground-rgb: 18 14 8;
          }

          .font-serif { font-family: 'Crimson Text', serif; }

          .bcc-text { color: var(--bcc-text); }
          .bcc-muted { color: rgb(var(--bcc-muted-rgb) / 0.92); }

          .bcc-dots {
            opacity: 0.055;
            background-image: radial-gradient(circle at 1px 1px, rgb(var(--bcc-accent-rgb) / 0.50) 1px, transparent 0);
            background-size: 60px 60px;
          }

          .bcc-nav {
            background:
              radial-gradient(120% 160% at 20% 0%, rgb(var(--bcc-accent-rgb) / 0.06), transparent 60%),
              linear-gradient(180deg, rgb(var(--bcc-surface-rgb) / 0.75), rgb(var(--bcc-bg-rgb) / 0.70));
            border-color: rgb(var(--bcc-border-rgb) / 0.65);
            backdrop-filter: blur(10px);
          }

          .bcc-hero-overlay {
            background:
              radial-gradient(900px 520px at 12% 10%, rgb(var(--bcc-accent-rgb) / 0.14), transparent 62%),
              radial-gradient(900px 520px at 88% 0%, rgb(var(--bcc-accent-2-rgb) / 0.12), transparent 65%),
              linear-gradient(180deg, rgb(0 0 0 / 0.05), transparent);
          }

          .bcc-fade-line { background: linear-gradient(to right, transparent, rgb(var(--bcc-accent-rgb) / 0.60)); }
          .bcc-fade-line--reverse { background: linear-gradient(to left, transparent, rgb(var(--bcc-accent-rgb) / 0.60)); }
          .bcc-dot { background: rgb(var(--bcc-accent-rgb) / 0.95); }

          .bcc-link {
            color: rgb(var(--bcc-text-rgb) / 0.92);
            background: transparent;
            border: 1px solid transparent;
            transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
          }
          .bcc-link:hover {
            background: rgb(var(--bcc-surface-rgb) / 0.55);
            border-color: rgb(var(--bcc-border-rgb) / 0.55);
            transform: translateY(-1px);
          }

          .bcc-btn-primary {
            background:
              radial-gradient(120% 160% at 20% 10%, rgb(var(--bcc-accent-foreground-rgb) / 0.18), transparent 55%),
              linear-gradient(180deg, rgb(var(--bcc-accent-rgb) / 1), rgb(var(--bcc-accent-rgb) / 0.92));
            color: var(--bcc-accent-foreground);
            border: 2px solid rgb(var(--bcc-border-rgb) / 0.55);
            transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease;
            box-shadow: 0 8px 22px rgb(var(--bcc-text-rgb) / 0.10);
          }
          .bcc-btn-primary:hover {
            transform: translateY(-1px);
            filter: saturate(1.02) brightness(1.01);
            box-shadow: 0 12px 35px rgb(var(--bcc-text-rgb) / 0.12);
          }

          .bcc-btn-outline {
            background: rgb(var(--bcc-surface-rgb) / 0.60);
            color: rgb(var(--bcc-text-rgb) / 0.92);
            border: 2px solid rgb(var(--bcc-border-rgb) / 0.70);
            transition: background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
            box-shadow: 0 8px 22px rgb(var(--bcc-text-rgb) / 0.08);
          }
          .bcc-btn-outline:hover {
            background: rgb(var(--bcc-surface-rgb) / 0.78);
            transform: translateY(-1px);
            box-shadow: 0 12px 35px rgb(var(--bcc-text-rgb) / 0.10);
          }

          .bcc-pill {
            background: rgb(var(--bcc-surface-rgb) / 0.65);
            color: var(--bcc-text);
            border-color: rgb(var(--bcc-border-rgb) / 0.70);
          }

          .bcc-arrow { opacity: 0.95; transform: translateY(-0.5px); }

          /* ✅ Rectangle logo: slightly bigger, keeps rectangle aspect */
          .bcc-logo-rect {
            width: 168px;
            height: 54px;
            border-radius: 16px;
            border: 1px solid rgb(var(--bcc-border-rgb) / 0.70);
            background: rgb(var(--bcc-surface-rgb) / 0.72);
            box-shadow: 0 10px 25px rgb(var(--bcc-text-rgb) / 0.08);
            display: grid;
            place-items: center;
            overflow: hidden;
          }
          .bcc-logo-rect__img {
            width: 92%;
            height: 92%;
            object-fit: contain;
          }

          /* ✅ Hero logo: bigger rectangle */
          .bcc-hero-logo-rect {
            width: 260px;
            height: 92px;
            border-radius: 22px;
            border: 1px solid rgb(var(--bcc-border-rgb) / 0.70);
            background: rgb(var(--bcc-surface-rgb) / 0.70);
            box-shadow: 0 18px 50px rgb(var(--bcc-text-rgb) / 0.12);
            display: grid;
            place-items: center;
            overflow: hidden;
          }
          .bcc-hero-logo-rect__img {
            width: 92%;
            height: 92%;
            object-fit: contain;
          }

          a:focus-visible {
            outline: 2px solid rgb(var(--bcc-accent-rgb) / 0.85);
            outline-offset: 2px;
            border-radius: 14px;
          }

          /* responsive tweaks so header doesn't overflow on small screens */
          @media (max-width: 480px) {
            .bcc-logo-rect { width: 138px; height: 46px; border-radius: 14px; }
            .bcc-hero-logo-rect { width: 220px; height: 82px; border-radius: 20px; }
          }
        `}</style>
      </div>
    </>
  );
}
