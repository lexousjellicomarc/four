import { Link } from '@inertiajs/react';
import SafeImage from '@/components/ui/safe-image';

type Action = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  backgroundImages?: string[];
  actions?: Action[];
};

export default function PageHero({
  eyebrow,
  title,
  description,
  backgroundImages = ['/marketing/images/branding/noon.jpg'],
  actions = [],
}: Props) {
  const light = backgroundImages[0] || '/marketing/images/branding/noon.jpg';
  const dark = backgroundImages[1] || '/marketing/images/hero/night.png';

  return (
    <section className="public-container">
      <div className="hero-shadow relative overflow-hidden rounded-[2.2rem] border border-white/20">
        <SafeImage src={light} fallbackSrc="/marketing/images/branding/noon.jpg" alt={title} className="absolute inset-0 dark:hidden" imgClassName="h-full w-full object-cover" />
        <SafeImage src={dark} fallbackSrc="/marketing/images/hero/night.png" alt={title} className="absolute inset-0 hidden dark:block" imgClassName="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,33,0.18)_0%,rgba(11,19,33,0.45)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.25)_0%,rgba(2,6,23,0.72)_100%)]" />

        <div className="relative px-6 py-16 text-white sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <div className="public-chip border-white/20 bg-white/10 text-white">{eyebrow}</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-white/90 sm:text-base">{description}</p>

            {actions.length > 0 ? (
              <div className="scrollbar-hide mt-6 flex gap-3 overflow-x-auto pb-1">
                {actions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={`inline-flex shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      action.variant === 'secondary'
                        ? 'border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15'
                        : 'bg-[#0f8b6d] text-white hover:opacity-90 dark:bg-[#294CFF]'
                    }`}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
