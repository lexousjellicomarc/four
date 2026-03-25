import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type HeroAction = {
  label: string;
  href: string;
  external?: boolean;
  variant?: 'primary' | 'secondary';
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage?: string;
  backgroundImages?: string[];
  fullHeight?: boolean;
  actions?: HeroAction[];
  align?: 'left' | 'center';
  children?: React.ReactNode;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
  backgroundImages = [],
  fullHeight = false,
  actions = [],
  align = 'left',
  children,
}: PageHeroProps) {
  const slides = useMemo(() => {
    const all = [...backgroundImages];
    if (backgroundImage) all.push(backgroundImage);

    return all.length > 0
      ? all
      : ['/marketing/images/branding/noon.jpg'];
  }, [backgroundImage, backgroundImages]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(id);
  }, [slides.length]);

  const isCentered = align === 'center';

  return (
    <section className="px-4 pt-4 sm:px-6 lg:px-8">
      <div
        className={`relative mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] border border-white/20 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${
          fullHeight ? 'min-h-[calc(100vh-7.5rem)]' : 'min-h-[56vh]'
        }`}
      >
        <div className="absolute inset-0">
          {slides.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ${
                index === activeIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,20,0.25)_0%,rgba(10,15,20,0.38)_38%,rgba(10,15,20,0.65)_100%)]" />
        </div>

        <div className="relative flex min-h-[inherit] items-end">
          <div
            className={`w-full px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14 ${
              isCentered ? 'text-center' : 'text-left'
            }`}
          >
            <div className={`mx-auto ${isCentered ? 'max-w-4xl' : 'max-w-3xl'}`}>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/90 backdrop-blur">
                {eyebrow}
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>

              <p className="mt-4 text-sm leading-8 text-white/85 sm:text-base">
                {description}
              </p>

              {actions.length > 0 && (
                <div className={`mt-7 flex flex-wrap gap-3 ${isCentered ? 'justify-center' : ''}`}>
                  {actions.map((action) =>
                    action.external ? (
                      <a
                        key={`${action.href}-${action.label}`}
                        href={action.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                          action.variant === 'secondary'
                            ? 'border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15'
                            : 'bg-[#0f8b6d] text-white hover:opacity-90'
                        }`}
                      >
                        {action.label}
                      </a>
                    ) : (
                      <Link
                        key={`${action.href}-${action.label}`}
                        href={action.href}
                        className={`inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                          action.variant === 'secondary'
                            ? 'border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15'
                            : 'bg-[#0f8b6d] text-white hover:opacity-90'
                        }`}
                      >
                        {action.label}
                      </Link>
                    ),
                  )}
                </div>
              )}

              {children ? <div className="mt-7">{children}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
