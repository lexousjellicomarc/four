import { Head, useForm, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { FormEvent } from 'react';
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  SendHorizonal,
  Sparkles,
} from 'lucide-react';
import PublicLayout, { type SiteSettings } from '@/layouts/public-layout';
import type { VenueOption } from '@/types/public-content';

type Props = {
  venueOptions?: VenueOption[];
};

type InquiryForm = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  inquiry_type: string;
  event_date: string;
  venue: string;
  guest_count: string;
  message: string;
};

const inquiryTypes = [
  'General Inquiry',
  'Booking Guidance',
  'Venue Availability',
  'Event Coordination',
  'Payment Clarification',
  'Tourism and Visit Support',
  'Others',
];

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">{message}</p>;
}

function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
        {label}
      </span>
      {children}
      <FieldError message={error} />
    </label>
  );
}

export default function ContactPage({ venueOptions = [] }: Props) {
  const reduceMotion = useReducedMotion();
  const page = usePage<{ siteSettings?: SiteSettings; flash?: { success?: string } }>();
  const settings = page.props.siteSettings;

  const mapEmbedUrl =
    settings?.mapEmbedUrl ||
    'https://www.google.com/maps?q=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines&z=16&output=embed';

  const { data, setData, post, processing, errors, reset } = useForm<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    inquiry_type: 'General Inquiry',
    event_date: '',
    venue: '',
    guest_count: '',
    message: '',
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();

    post('/inquiries', {
      preserveScroll: true,
      onSuccess: () => {
        reset('name', 'email', 'phone', 'subject', 'inquiry_type', 'event_date', 'venue', 'guest_count', 'message');
      },
    });
  };

  return (
    <PublicLayout>
      <Head title="Contact" />

      <section className="relative min-h-[72svh] overflow-hidden bg-[#080806] pt-32 text-white lg:pt-36">
        <img
          src="/marketing/images/hero/noon2.jpg"
          alt="Baguio Convention and Cultural Center contact"
          className="absolute inset-0 h-full w-full object-cover opacity-70 dark:hidden"
          draggable={false}
        />

        <img
          src="/marketing/images/hero/night2.png"
          alt="Baguio Convention and Cultural Center contact"
          className="absolute inset-0 hidden h-full w-full object-cover opacity-70 dark:block"
          draggable={false}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.86)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080806] via-[#080806]/58 to-black/24" />

        <div className="public-container relative z-10 grid min-h-[calc(72svh-9rem)] gap-8 pb-12 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury }}
          >
            <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              <Mail className="h-3.5 w-3.5" />
              Contact
            </div>

            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.085em] text-white">
              Coordinate with the BCCC office.
            </h1>
          </motion.div>

          <motion.aside
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury, delay: 0.12 }}
            className="border border-white/12 bg-white/[0.075] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              Contact Details
            </p>

            <div className="mt-5 grid gap-3">
              <div className="flex items-start gap-3 border border-white/10 bg-white/[0.055] p-4 text-sm leading-7 text-white/68">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#f4dfad]" />
                {settings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}
              </div>

              <div className="flex items-center gap-3 border border-white/10 bg-white/[0.055] p-4 text-sm leading-7 text-white/68">
                <Phone className="h-4 w-4 shrink-0 text-[#f4dfad]" />
                {settings?.phone || '(074) 446 2009'}
              </div>

              <div className="flex items-center gap-3 border border-white/10 bg-white/[0.055] p-4 text-sm leading-7 text-white/68">
                <Mail className="h-4 w-4 shrink-0 text-[#f4dfad]" />
                {settings?.email || 'info@bccc-ease.com'}
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="public-section relative overflow-hidden">
        <div className="public-container grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-4">
            <div className="bccc-public-panel p-6">
              <div className="bccc-section-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Public Enquiries
              </div>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--bccc-text)]">
                Send an enquiry to the office.
              </h2>

              <p className="mt-4 text-sm leading-8 text-[var(--bccc-text-muted)]">
                Use this form for availability clarifications, venue coordination, tourism-related questions, and general concerns.
              </p>

              <div className="mt-6 grid gap-3">
                {[
                  'Booking guidance and schedule clarification',
                  'Venue coordination and event preparation',
                  'Tourism, public information, and general questions',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bccc-gold-700)]" />
                    <p className="text-sm leading-7 text-[var(--bccc-text-muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl">
              <iframe
                title="BCCC location map"
                src={mapEmbedUrl}
                className="h-[24rem] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </aside>

          <motion.form
            onSubmit={submit}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22, filter: 'blur(10px)' }}
            whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.16 }}
            transition={{ duration: 0.62, ease: easeLuxury }}
            className="border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl sm:p-6 lg:p-8"
          >
            {page.props.flash?.success ? (
              <div className="mb-5 flex items-start gap-3 border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-700 dark:text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {page.props.flash.success}
              </div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Full Name" error={errors.name}>
                <input
                  value={data.name}
                  onChange={(event) => setData('name', event.target.value)}
                  className="bccc-inner-input"
                />
              </FormField>

              <FormField label="Valid Email" error={errors.email}>
                <input
                  type="email"
                  value={data.email}
                  onChange={(event) => setData('email', event.target.value)}
                  className="bccc-inner-input"
                />
              </FormField>

              <FormField label="Phone" error={errors.phone}>
                <input
                  value={data.phone}
                  onChange={(event) => setData('phone', event.target.value)}
                  className="bccc-inner-input"
                />
              </FormField>

              <FormField label="Subject" error={errors.subject}>
                <input
                  value={data.subject}
                  onChange={(event) => setData('subject', event.target.value)}
                  className="bccc-inner-input"
                />
              </FormField>

              <FormField label="Inquiry Type" error={errors.inquiry_type}>
                <select
                  value={data.inquiry_type}
                  onChange={(event) => setData('inquiry_type', event.target.value)}
                  className="bccc-inner-input"
                >
                  {inquiryTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Preferred Event Date" error={errors.event_date}>
                <input
                  type="date"
                  value={data.event_date}
                  onChange={(event) => setData('event_date', event.target.value)}
                  className="bccc-inner-input"
                />
              </FormField>

              <FormField label="Venue" error={errors.venue}>
                <select
                  value={data.venue}
                  onChange={(event) => setData('venue', event.target.value)}
                  className="bccc-inner-input"
                >
                  <option value="">Select venue</option>
                  {venueOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Estimated Guests" error={errors.guest_count}>
                <input
                  type="number"
                  min="1"
                  value={data.guest_count}
                  onChange={(event) => setData('guest_count', event.target.value)}
                  className="bccc-inner-input"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Message" error={errors.message}>
                  <textarea
                    value={data.message}
                    onChange={(event) => setData('message', event.target.value)}
                    rows={7}
                    className="bccc-inner-input resize-none py-4"
                  />
                </FormField>
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="mt-6 inline-flex items-center justify-center gap-2 border border-[var(--bccc-line-gold)] bg-[var(--bccc-green-800)] px-6 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white transition duration-500 hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)] disabled:cursor-wait disabled:opacity-70"
            >
              <SendHorizonal className="h-4 w-4" />
              {processing ? 'Sending...' : 'Submit Enquiry'}
            </button>
          </motion.form>
        </div>
      </section>
    </PublicLayout>
  );
}
