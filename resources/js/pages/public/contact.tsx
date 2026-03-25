import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import PageHero from '@/components/public/page-hero';
import PublicLayout, { type SiteSettings } from '@/layouts/public-layout';

type ContactPageProps = {
  siteSettings?: SiteSettings;
  flash?: {
    success?: string | null;
    error?: string | null;
  };
};

export default function ContactPage() {
  const page = usePage<ContactPageProps>();
  const siteSettings = page.props.siteSettings;
  const flash = page.props.flash;

  const address = siteSettings?.address ?? 'CH3X+RRW, Baguio, Benguet, Philippines';
  const phone = siteSettings?.phone ?? '(074) 446 2009';
  const email = siteSettings?.email ?? 'info@bccc-ease.com';
  const openMapUrl =
    siteSettings?.openMapUrl ??
    'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines';

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    subject: '',
    inquiry_type: '',
    event_date: '',
    venue: '',
    guest_count: '',
    message: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    post('/inquiries', {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  }

  return (
    <PublicLayout>
      <Head title="Contact" />

      <div className="space-y-10 pb-12">
        <PageHero
          eyebrow="Contact Us"
          title="Venue contact and inquiry"
          description="Send direct inquiries, ask for office assistance, or reach the venue through the official public contact details."
          backgroundImages={[
            '/marketing/images/branding/sunrise.jpg',
            '/marketing/images/branding/noon.jpg',
            '/marketing/images/events/lightmain.JPG',
          ]}
          actions={[
            { label: 'Check Calendar', href: '/calendar' },
            { label: 'View Events', href: '/events', variant: 'secondary' },
          ]}
        />

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318] sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Contact Details
                </div>

                <div className="mt-6 grid gap-4">
                  <a
                    href={openMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{address}</span>
                  </a>

                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{phone}</span>
                  </a>

                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{email}</span>
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Check Calendar
                  </Link>

                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    View Events
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318] sm:p-8">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Inquiry Form
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Send a message
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                      required
                    />
                    {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name}</p> : null}
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                      required
                    />
                    {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email}</p> : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Phone number"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                    />
                    {errors.phone ? <p className="mt-2 text-sm text-red-600">{errors.phone}</p> : null}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Subject"
                      value={data.subject}
                      onChange={(e) => setData('subject', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                      required
                    />
                    {errors.subject ? <p className="mt-2 text-sm text-red-600">{errors.subject}</p> : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <select
                      value={data.inquiry_type}
                      onChange={(e) => setData('inquiry_type', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                    >
                      <option value="">Inquiry type</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Venue Booking">Venue Booking</option>
                      <option value="Event Coordination">Event Coordination</option>
                      <option value="Tourism Office">Tourism Office</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="date"
                      value={data.event_date}
                      onChange={(e) => setData('event_date', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      min="1"
                      placeholder="Guest count"
                      value={data.guest_count}
                      onChange={(e) => setData('guest_count', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Preferred venue or area"
                    value={data.venue}
                    onChange={(e) => setData('venue', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Write your message here"
                    value={data.message}
                    onChange={(e) => setData('message', e.target.value)}
                    rows={6}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
                    required
                  />
                  {errors.message ? <p className="mt-2 text-sm text-red-600">{errors.message}</p> : null}
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? 'Sending...' : 'Send Inquiry'}
                </button>

                {flash?.success ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {flash.success}
                  </div>
                ) : null}

                {flash?.error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                    {flash.error}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
