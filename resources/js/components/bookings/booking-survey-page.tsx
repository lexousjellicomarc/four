import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  bookingBasePath,
  bookingShowPath,
  formatDateTime,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileImage,
  Loader2,
  QrCode,
  UploadCloud,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import qrFallback from '@/components/logo/qr.png';

type BookingSurveyPageProps = {
  workspaceRole?: string;
  booking?: BookingLike;
  survey?: {
    url?: string | null;
    qr_image_url?: string | null;
  };
};

type SurveyFormData = {
  survey_email: string;
  survey_proof_image: File | null;
};

function normalizeAssetUrl(url: string) {
  const value = String(url || '').trim();

  if (!value) return value;
  if (/^(https?:\/\/|data:|blob:|\/)/i.test(value)) return value;

  return `/${value}`;
}

export function BookingSurveyPage() {
  const { props } = usePage<BookingSurveyPageProps>();
  const role = normalizeWorkspaceRole(props.workspaceRole);
  const booking = props.booking;
  const survey = props.survey ?? {};
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrStage, setQrStage] = useState<'remote' | 'fallback' | 'none'>(
    survey.qr_image_url ? 'remote' : 'fallback',
  );

  const { data, setData, post, processing, errors } = useForm<SurveyFormData>({
    survey_email: String(booking?.survey_email || booking?.client_email || ''),
    survey_proof_image: null,
  });

  const qrSrc = useMemo(() => {
    if (qrStage === 'remote' && survey.qr_image_url) {
      return normalizeAssetUrl(String(survey.qr_image_url));
    }

    if (qrStage === 'fallback') {
      return qrFallback;
    }

    return null;
  }, [qrStage, survey.qr_image_url]);

  useEffect(() => {
    if (!data.survey_proof_image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(data.survey_proof_image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [data.survey_proof_image]);

  if (!booking) {
    return (
      <BookingRolePageShell role={role} title="Survey requirement not found">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
          <p className="text-sm opacity-70">The booking survey page could not be loaded.</p>
          <Link
            href={bookingBasePath(role)}
            className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold"
          >
            Back to bookings
          </Link>
        </div>
      </BookingRolePageShell>
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    post(`${bookingBasePath(role)}/${booking.id}/survey`, {
      forceFormData: true,
      preserveScroll: true,
    });
  }

  return (
    <BookingRolePageShell
      role={role}
      title="Survey Reference Requirement"
      description="Complete the required survey reference and upload the proof image connected to this booking."
      actions={
        <Link
          href={bookingShowPath(role, booking.id)}
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking
        </Link>
      }
    >
      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                  Booking #{booking.id}
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {booking.type_of_event || 'Event Booking'}
                </h2>
                <p className="mt-1 text-sm opacity-65">
                  {booking.company_name || booking.client_name || 'Client'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <BookingStatusBadge value={booking.booking_status} />
                <BookingStatusBadge value={booking.payment_status} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] opacity-50">
                  Schedule
                </p>
                <p className="mt-2 text-sm font-bold">
                  {formatDateTime(booking.booking_date_from)}
                </p>
                <p className="mt-1 text-xs opacity-60">
                  to {formatDateTime(booking.booking_date_to)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] opacity-50">
                  Guests
                </p>
                <p className="mt-2 text-sm font-bold">
                  {booking.number_of_guests || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur"
          >
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                Upload Survey Proof
              </p>
              <h3 className="mt-1 text-xl font-black">
                Submit survey reference
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 opacity-65">
                Use the same email you entered in the survey form. Upload a screenshot or image proof after completing the form.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Survey Email
                </span>
                <input
                  value={data.survey_email}
                  onChange={(event) => setData('survey_email', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25"
                  placeholder="name@example.com"
                />
                {errors.survey_email ? (
                  <p className="text-xs font-bold text-red-300">{errors.survey_email}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Survey Proof Image
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(event) => setData('survey_proof_image', event.target.files?.[0] ?? null)}
                  className="block h-11 w-full cursor-pointer rounded-2xl border border-white/10 bg-black/10 text-sm file:mr-4 file:h-full file:border-0 file:bg-white/10 file:px-4 file:text-sm file:font-bold file:text-current hover:file:bg-white/15"
                />
                {errors.survey_proof_image ? (
                  <p className="text-xs font-bold text-red-300">{errors.survey_proof_image}</p>
                ) : null}
              </label>

              {previewUrl ? (
                <div className="rounded-3xl border border-white/10 bg-black/[0.08] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] opacity-60">
                    Proof Preview
                  </p>
                  <img
                    src={previewUrl}
                    alt="Survey proof preview"
                    className="max-h-80 w-full rounded-2xl object-contain"
                  />
                </div>
              ) : null}

              {booking.survey_proof_image_url ? (
                <a
                  href={booking.survey_proof_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/[0.08] px-4 py-3 text-sm font-bold transition hover:bg-white/[0.06]"
                >
                  Existing proof is already uploaded
                  <FileImage className="h-4 w-4 opacity-70" />
                </a>
              ) : null}

              <button
                type="submit"
                disabled={processing}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/12 px-6 text-sm font-black transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                Save Survey Proof
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="mb-5 flex items-center gap-3">
              <QrCode className="h-5 w-5 opacity-70" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                  Survey QR
                </p>
                <h3 className="text-xl font-black">Open the survey</h3>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/[0.08] p-4">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="Survey QR"
                  className="mx-auto aspect-square w-full max-w-[260px] object-contain"
                  onError={() => {
                    if (qrStage === 'remote') {
                      setQrStage('fallback');
                    } else {
                      setQrStage('none');
                    }
                  }}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm opacity-60">
                  QR image is not available.
                </div>
              )}
            </div>

            {survey.url ? (
              <a
                href={String(survey.url)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
              >
                Open Survey Form
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5 text-sm leading-6 text-emerald-100">
            <CheckCircle2 className="mb-3 h-5 w-5" />
            Complete the survey before final booking review. BCCC may use this proof as part of internal verification and reporting.
          </div>
        </aside>
      </section>
    </BookingRolePageShell>
  );
}
