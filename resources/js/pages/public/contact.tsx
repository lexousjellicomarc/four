import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Mail, MapPin, Phone, SendHorizonal } from 'lucide-react';
import PageHero from '@/components/public/page-hero';
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

export default function ContactPage({ venueOptions = [] }: Props) {
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

  const submit = (e: FormEvent) => {
    e.preventDefault();
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

      <PageHero
        eyebrow="Contact"
        title="Get in touch for venue guidance, inquiries, and public assistance."
        description="Use the contact details below for general questions, booking guidance, and coordination support. The enquiry form is open to all visitors."
        backgroundImages={['/marketing/images/branding/sunrise.jpg', '/marketing/images/hero/night.png']}
        actions={[
          { label: 'Proceed to Booking', href: '/bookings/create' },
          { label: 'View Guidelines', href: '/guidelines', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 grid gap-6 pb-12 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Contact Details</h2>

          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-3 rounded-[1.3rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{settings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-[1.3rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{settings?.phone || '(074) 446 2009'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-[1.3rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{settings?.email || 'info@bccc-ease.com'}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <iframe
              src={mapEmbedUrl}
              className="h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="BCCC location map"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">Public Enquiries</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Send an enquiry to the office</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                This form is open to anyone. Use it for availability clarifications, venue coordination, tourism-related questions, and general concerns.
              </p>
            </div>
          </div>

          {page.props.flash?.success ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              {page.props.flash.success}
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Full Name</label>
              <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5" />
              {errors.name ? <div className="mt-1 text-xs text-red-600">{errors.name}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Valid Email</label>
              <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5" />
              {errors.email ? <div className="mt-1 text-xs text-red-600">{errors.email}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Phone</label>
              <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5" />
              {errors.phone ? <div className="mt-1 text-xs text-red-600">{errors.phone}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Subject</label>
              <input value={data.subject} onChange={(e) => setData('subject', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5" />
              {errors.subject ? <div className="mt-1 text-xs text-red-600">{errors.subject}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Inquiry Type</label>
              <select value={data.inquiry_type} onChange={(e) => setData('inquiry_type', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                {inquiryTypes.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.inquiry_type ? <div className="mt-1 text-xs text-red-600">{errors.inquiry_type}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Preferred Event Date</label>
              <input type="date" value={data.event_date} onChange={(e) => setData('event_date', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5" />
              {errors.event_date ? <div className="mt-1 text-xs text-red-600">{errors.event_date}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Venue</label>
              <select value={data.venue} onChange={(e) => setData('venue', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                <option value="">Select venue</option>
                {venueOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              {errors.venue ? <div className="mt-1 text-xs text-red-600">{errors.venue}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Estimated Guests</label>
              <input value={data.guest_count} onChange={(e) => setData('guest_count', e.target.value)} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5" />
              {errors.guest_count ? <div className="mt-1 text-xs text-red-600">{errors.guest_count}</div> : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Message</label>
              <textarea value={data.message} onChange={(e) => setData('message', e.target.value)} rows={6} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5" />
              {errors.message ? <div className="mt-1 text-xs text-red-600">{errors.message}</div> : null}
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70 dark:bg-[#294CFF]">
                <SendHorizonal className="h-4 w-4" />
                {processing ? 'Sending...' : 'Submit Enquiry'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
