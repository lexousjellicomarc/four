import { usePage } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, Mail, MapPin, Phone, Send, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SiteSettings } from '@/layouts/public-layout';
import type { FeaturePackageItem } from '@/types/public-content';

const PAGE_SIZE = 2;

const FAQ_ITEMS = [
  {
    question: 'How do I check if a date is available?',
    answer:
      'Use the quick availability checker on the home page or the public calendar. Select the date, venue, and guest count, then review the AM, PM, and EVE time block status before proceeding.',
  },
  {
    question: 'Can I request several dates at once?',
    answer:
      'Yes. The quick checker now supports a start date and end date so you can review multiple days before opening the booking form.',
  },
  {
    question: 'What does AM, PM, and EVE mean?',
    answer:
      'AM covers the morning block, PM covers the afternoon block, and EVE covers the evening block. A date may still be bookable if only one or two blocks are occupied.',
  },
  {
    question: 'What happens after I submit a booking?',
    answer:
      'Your booking moves into the next details and payment flow. A booking is not treated as fully settled until the payment step and proof submission are completed according to the configured rules.',
  },
  {
    question: 'Can I pay online?',
    answer:
      'The current interface supports a trial online payment flow for card, PayPal, and GCash style options, along with screenshot proof and reference number submission.',
  },
];

function answerFor(input: string) {
  const text = input.toLowerCase().trim();

  if (!text) {
    return 'Ask about availability, booking requirements, payments, time blocks, events, or venue options.';
  }

  if (text.includes('availability') || text.includes('available') || text.includes('date')) {
    return 'To check availability, choose a date or date range, select the venue, event type, and guest count, then review the AM, PM, and EVE block results. Dates with blocked or private-booked markers should be changed before continuing.';
  }

  if (text.includes('payment') || text.includes('gcash') || text.includes('paypal') || text.includes('card')) {
    return 'The current client flow supports a trial payment screen where the client can choose down payment or full payment, then provide a reference number and screenshot proof after the payment step.';
  }

  if (text.includes('book') || text.includes('booking')) {
    return 'The usual flow is: check availability → open the booking page → complete required client and event details → continue to payment → upload proof and reference number if needed.';
  }

  if (text.includes('am') || text.includes('pm') || text.includes('eve') || text.includes('time block')) {
    return 'AM, PM, and EVE are separate schedule blocks. Even if one block is occupied, the remaining blocks on the same date may still be available depending on the confirmed schedule.';
  }

  if (text.includes('event') || text.includes('city') || text.includes('bccc')) {
    return 'BCCC Events and Baguio City Events are now separated into their own carousel sections so visitors can scan venue-specific activities apart from broader city highlights.';
  }

  if (text.includes('venue') || text.includes('hall') || text.includes('room') || text.includes('space')) {
    return 'Available venue options include Full Hall, Main Hall, Foyer & Lobby Area, VIP Lounge, Board Room, Basement, and Gallery2600, each with its own category and capacity context.';
  }

  return 'I can help with date availability, booking flow, payments, event sections, venue options, and AM/PM/EVE schedule blocks. Try asking one of those directly.';
}

export default function SpecialOffers({ items = [] }: { items?: FeaturePackageItem[] }) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;
  const [pageIndex, setPageIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello. I am your BCCC EASE guide. Ask me about bookings, payments, events, venues, or schedule blocks.',
    },
  ]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const visibleOffers = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [pageIndex, items]);

  const openMapUrl =
    siteSettings?.openMapUrl ||
    'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines';

  const sendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: answerFor(trimmed) },
    ]);
    setChatInput('');
  };

  return (
    <section className="mt-14 w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        <div className="rounded-[2.2rem] border border-black/5 bg-white/86 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="public-chip border-[#0f8b6d]/20 bg-[#0f8b6d]/10 text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
                Special Offers
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Contact details on one side, featured offers on the other.
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={pageIndex === 0}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white"
                aria-label="Previous offers"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-sm font-medium text-slate-500 dark:text-slate-300">
                {pageIndex + 1} / {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={pageIndex >= totalPages - 1}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white"
                aria-label="Next offers"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-[#f8f4ea] dark:border-white/10 dark:bg-slate-900/70">
              <div className="relative h-[240px] overflow-hidden">
                <img
                  src="/marketing/images/events/lightmain.JPG"
                  alt="BCCC location"
                  className="h-full w-full object-cover dark:hidden"
                />
                <img
                  src="/marketing/images/events/darkmain.JPG"
                  alt="BCCC location"
                  className="hidden h-full w-full object-cover dark:block"
                />
                <div className="absolute inset-0 bg-slate-950/38" />
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-800">
                  Contact and Location
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <a
                  href={openMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 rounded-[1.2rem] border border-black/5 bg-white px-4 py-4 text-sm text-slate-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{siteSettings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}</span>
                </a>

                <a
                  href={`tel:${siteSettings?.phone || ''}`}
                  className="flex items-center gap-3 rounded-[1.2rem] border border-black/5 bg-white px-4 py-4 text-sm text-slate-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{siteSettings?.phone || '(074) 446 2009'}</span>
                </a>

                <a
                  href={`mailto:${siteSettings?.email || ''}`}
                  className="flex items-center gap-3 rounded-[1.2rem] border border-black/5 bg-white px-4 py-4 text-sm text-slate-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{siteSettings?.email || 'info@bccc-ease.com'}</span>
                </a>

                <iframe
                  src={siteSettings?.mapEmbedUrl || 'https://www.google.com/maps?q=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines&z=16&output=embed'}
                  title="BCCC location map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[250px] w-full rounded-[1.5rem] border border-black/5 dark:border-white/10"
                />
              </div>
            </div>

            <div>
              {visibleOffers.length > 0 ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {visibleOffers.map((offer) => (
                    <article
                      key={String(offer.id)}
                      className="group overflow-hidden rounded-[2rem] border border-black/5 bg-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/60"
                    >
                      <div className="h-64 overflow-hidden">
                        <img
                          src={offer.lightImage || offer.image}
                          alt={offer.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105 dark:hidden"
                        />
                        <img
                          src={offer.darkImage || offer.image}
                          alt={offer.title}
                          className="hidden h-full w-full object-cover transition duration-500 group-hover:scale-105 dark:block"
                        />
                      </div>

                      <div className="space-y-3 px-5 py-5">
                        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                          Special Offer
                        </div>
                        <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                          {offer.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{offer.subtitle}</p>
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{offer.description}</p>
                        <a
                          href={offer.href || '/contact'}
                          className="inline-flex items-center rounded-full bg-[#174f40] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
                        >
                          {offer.buttonLabel}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-black/10 bg-white/75 px-6 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  No feature packages are visible yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-black/5 bg-white/86 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
            <div className="inline-flex rounded-full border border-[#174f40]/20 bg-[#174f40]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#174f40] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
              Client Guide Chatbot
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              A built-in assistant for common booking questions.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              This guide answers basic client questions about dates, booking flow, payments, venues, and time blocks before they reach staff.
            </p>

            <div className="mt-6 rounded-[1.8rem] border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-[1.2rem] px-4 py-3 text-sm leading-7 ${
                      message.role === 'assistant'
                        ? 'bg-white text-slate-700 dark:bg-white/5 dark:text-slate-200'
                        : 'bg-[#174f40] text-white dark:bg-[#294CFF]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="mb-1 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] opacity-80">
                        <Sparkles className="h-3.5 w-3.5" /> BCCC Guide
                      </div>
                    ) : null}
                    <div>{message.text}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about availability, payments, venues, or time blocks..."
                  className="min-h-[52px] flex-1 rounded-[1.2rem] border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[1.2rem] bg-[#174f40] px-5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-black/5 bg-white/86 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
            <div className="inline-flex rounded-full border border-[#7c3aed]/20 bg-[#7c3aed]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#7c3aed] dark:border-[#c4b5fd]/20 dark:bg-[#c4b5fd]/10 dark:text-[#ddd6fe]">
              Frequently Asked Questions
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Answers to the common questions clients ask first.
            </h2>

            <div className="mt-6 space-y-3">
              {FAQ_ITEMS.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-[1.4rem] border border-black/5 bg-slate-50 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq((prev) => (prev === index ? null : index))}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-base font-semibold text-slate-900 dark:text-white">{item.question}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open ? (
                      <div className="border-t border-black/5 px-5 py-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300">
                        {item.answer}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
