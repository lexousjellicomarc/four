import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, FileImage, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import qrFallback from '@/components/logo/qr.png';

type BookingItem = {
  id?: number;
  service_id?: number;
  service_name?: string | null;
  area?: string | null;
  price?: number | null;
  quantity?: number | null;
  line_total?: number | null;
};

type BookingSurveyPageProps = {
  booking: {
    id: number;
    client_name?: string | null;
    company_name?: string | null;
    client_email?: string | null;
    survey_email?: string | null;
    survey_proof_image_url?: string | null;
    type_of_event?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    number_of_guests?: number | null;
    booking_status?: string | null;
    payment_status?: string | null;
    items?: BookingItem[];
  };
  survey?: {
    url?: string | null;
    qr_image_url?: string | null;
  };
};

function breadcrumbs(bookingId: number): BreadcrumbItem[] {
  return [
    { title: 'Bookings', href: '/bookings' },
    { title: 'Create', href: '/bookings/create' },
    { title: `Survey ${bookingId}`, href: `/bookings/${bookingId}/survey` },
  ];
}

function formatDateLabel(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function normalizeAssetUrl(url: string) {
  const value = String(url || '').trim();
  if (!value) return value;
  if (/^(https?:\/\/|data:|blob:|\/)/i.test(value)) return value;
  return `/${value}`;
}

export default function BookingSurveyPage() {
  const page = usePage<BookingSurveyPageProps>();
  const booking = page.props.booking;
  const survey = page.props.survey ?? {};

  const { data, setData, post, processing, errors } = useForm<{
    survey_email: string;
    survey_proof_image: File | null;
  }>({
    survey_email: booking?.survey_email ?? booking?.client_email ?? '',
    survey_proof_image: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrStage, setQrStage] = useState<'remote' | 'fallback' | 'none'>(
    survey?.qr_image_url ? 'remote' : 'fallback',
  );

  useEffect(() => {
    if (!data.survey_proof_image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(data.survey_proof_image);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [data.survey_proof_image]);

  const qrSrc = useMemo(() => {
    if (qrStage === 'remote' && survey?.qr_image_url) {
      return normalizeAssetUrl(String(survey.qr_image_url));
    }

    if (qrStage === 'fallback') {
      return qrFallback;
    }

    return null;
  }, [qrStage, survey?.qr_image_url]);

  const serviceSummary = useMemo(() => {
    const items = Array.isArray(booking?.items) ? booking.items : [];
    const labels = items
      .map((item) => {
        const area = String(item?.area ?? '').trim();
        const service = String(item?.service_name ?? '').trim();

        if (area && service) return `${area} • ${service}`;
        return service || area;
      })
      .filter(Boolean);

    return labels.length > 0 ? labels.join(', ') : '—';
  }, [booking?.items]);

  function submitSurvey(event: React.FormEvent) {
    event.preventDefault();

    post(`/bookings/${booking.id}/survey`, {
      forceFormData: true,
    });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs(booking.id)}>
      <Head title={`Booking Survey ${booking.id}`} />

      <div className="space-y-6 p-4 md:p-6">
        <Card className="overflow-hidden border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4 px-6 py-8 sm:px-8">
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
                Booking Survey Step
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                  Finalize survey reference
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  The booking details are already saved in the database. This page is now only for the survey email
                  and proof image upload.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-[#f8f6f0] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Client
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {booking.client_name || '—'}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {booking.company_name || booking.client_email || '—'}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-[#f8f6f0] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Event
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {booking.type_of_event || '—'}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Guests: {booking.number_of_guests ?? '—'}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-[#f8f6f0] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Schedule
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {formatDateLabel(booking.booking_date_from)}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    to {formatDateLabel(booking.booking_date_to)}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-[#f8f6f0] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Services
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {serviceSummary}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Status: {booking.booking_status || 'pending'}{booking.payment_status ? ` • ${booking.payment_status}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#f4efe4] px-6 py-8 dark:bg-[#171a22] sm:px-8">
              <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11141b]">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Before uploading proof</div>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <p>1. Open the Google Form reference.</p>
                  <p>2. Fill in the form using the same email you will enter below.</p>
                  <p>3. Upload the screenshot or proof image after submission.</p>
                </div>

                {survey?.url ? (
                  <a
                    href={String(survey.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
                  >
                    Open Google Form
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}

                <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-[#faf8f2] p-4 dark:border-white/10 dark:bg-white/5">
                  {qrSrc ? (
                    <img
                      src={qrSrc}
                      alt="Survey QR"
                      className="mx-auto aspect-square w-full max-w-[220px] object-contain"
                      onError={() => {
                        if (qrStage === 'remote') {
                          setQrStage('fallback');
                        } else {
                          setQrStage('none');
                        }
                      }}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      QR image not available right now.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <form onSubmit={submitSurvey} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5" />
                Survey email and proof image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="survey_email">Survey email</Label>
                <Input
                  id="survey_email"
                  type="email"
                  value={data.survey_email}
                  onChange={(e) => setData('survey_email', e.target.value)}
                />
                {errors.survey_email ? (
                  <div className="text-sm text-red-600 dark:text-red-400">{errors.survey_email}</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="survey_proof_image">Survey proof image</Label>
                <Input
                  id="survey_proof_image"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => setData('survey_proof_image', e.target.files?.[0] ?? null)}
                />
                {errors.survey_proof_image ? (
                  <div className="text-sm text-red-600 dark:text-red-400">{errors.survey_proof_image}</div>
                ) : null}
              </div>

              {previewUrl ? (
                <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-slate-950/50">
                  <img src={previewUrl} alt="Survey proof preview" className="h-auto max-h-[420px] w-full object-contain" />
                </div>
              ) : null}

              {booking.survey_proof_image_url ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Existing proof already exists on this booking. Uploading here will replace it.
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      Make sure the uploaded image clearly shows the Google Form proof or reference screenshot.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileImage className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href={`/bookings/${booking.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to booking
              </Link>

              <Button type="submit" disabled={processing} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {processing ? 'Saving...' : 'Save survey reference'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
