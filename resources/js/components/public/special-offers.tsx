import LuxuryHorizontalRail from '@/components/public/luxury-horizontal-rail';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteSettings } from '@/layouts/public-layout';
import type { FeaturePackageItem } from '@/types/public-content';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

const MAX_VISIBLE_MESSAGES = 3;
const easeLuxury = [0.22, 1, 0.36, 1] as const;

const FAQ_ITEMS = [
  {
    question: 'How do I check if a date is available?',
    answer:
      'Use the quick availability checker on the home page or open the public calendar. Select your date range, venue area, event type, and guest count, then review the AM, PM, and EVE results before proceeding.',
  },
  {
    question: 'Can I request several dates at once?',
    answer:
      'Yes. The schedule flow can support a main date range and additional schedule entries when the selected event needs more than one date or time block.',
  },
  {
    question: 'What do AM, PM, and EVE mean?',
    answer:
      'AM is the morning block, PM is the afternoon block, and EVE is the evening block. A date may still be bookable if at least one of the three blocks remains open.',
  },
  {
    question: 'What happens after I submit a booking?',
    answer:
      'The request goes through schedule validation, client detail review, and payment review. A booking only moves forward once the required payment stage is confirmed under the current workflow.',
  },
  {
    question: 'Can I still ask the office directly?',
    answer:
      'Yes. The enquiry form and contact page remain available for venue clarifications, policy questions, and coordination with the BCCC office.',
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function answerFor(input: string) {
  const text = input.toLowerCase().trim();

  if (!text) {
    return 'Ask about availability, booking steps, payment review, public events, venue choices, additional hours, or policy reminders.';
  }

  if (text.includes('availability') || text.includes('available') || text.includes('date')) {
    return 'Choose the date range and venue first, then review the AM, PM, and EVE block results. Some dates may still have partial availability even if one block is already taken.';
  }

  if (text.includes('payment') || text.includes('gcash') || text.includes('paypal') || text.includes('card')) {
    return 'Client-submitted payments should stay pending until staff review. Prepare the amount, reference number, and proof image, then wait for confirmation in the booking workflow.';
  }

  if (text.includes('book') || text.includes('booking')) {
    return 'The usual flow is: check availability, open the booking form, complete client and event details, choose services, submit the request, then continue to the payment and proof-review stage when required.';
  }

  if (text.includes('am') || text.includes('pm') || text.includes('eve') || text.includes('time block')) {
    return 'AM, PM, and EVE are separate schedule blocks. If you select two or more continuous blocks, the whole-day logic should apply based on the selected service package.';
  }

  if (text.includes('event') || text.includes('city') || text.includes('public')) {
    return 'Public events appear on the client calendar so visitors can notice them and participate when applicable. Private bookings and blocked dates remain protected from private-detail exposure.';
  }

  if (text.includes('venue') || text.includes('hall') || text.includes('room') || text.includes('space')) {
    return 'Common venue options include Full Hall, Main Hall, Foyer & Lobby Area, VIP Lounge, Board Room, Basement, and Gallery2600. The best fit depends on guest count, event use, and schedule availability.';
  }

  if (text.includes('guideline') || text.includes('policy') || text.includes('terms')) {
    return 'The public guidelines page explains booking preparation, payment reminders, cancellation references, venue conduct, and client responsibilities.';
  }

  return 'I can help with date availability, booking flow, payments, public events, venue options, time blocks, and guidelines. Try asking one of those directly.';
}

function OfferCard({ offer, index }: { offer: FeaturePackageItem; index: number }) {
  const reduceMotion = useReducedMotion();

  const lightImage =
    offer.lightImage || offer.image || offer.images?.[0] || '/marketing/images/hero/noon2.jpg';
  const darkImage = offer.darkImage || offer.image || offer.images?.[0] || lightImage;
  const href = offer.href || '/bookings/create';

  return (
    <motion.article
      className="group min-w-[82vw] overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-line-gold)] hover:shadow-[var(--bccc-shadow-medium)] sm:min-w-[22rem] lg:min-w-[25rem] xl:min-w-[27rem]"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22, scale: 0.985 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.58, ease: easeLuxury, delay: Math.min(index * 0.055, 0.28) }}
    >
      <Link href={href} className="block h-full" aria-label={offer.buttonLabel || offer.title}>
        <div className="relative h-[17rem] overflow-hidden bg-[#080806] sm:h-[19rem]">
          <img
            src={lightImage}
            alt={offer.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] dark:hidden"
            draggable={false}
          />

          <img
            src={darkImage}
            alt={offer.title}
            className="absolute inset-0 hidden h-full w-full object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] dark:block"
            draggable={false}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/16 to-black/12" />

          <div className="absolute left-4 top-4 border border-[#f4dfad]/30 bg-[#f4dfad]/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#f4dfad] backdrop-blur-xl">
            Special Offer
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/62">
              {offer.subtitle || 'Featured package'}
            </p>

            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
              {offer.title}
            </h3>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <p className="min-h-[5.25rem] text-sm leading-7 text-[var(--bccc-text-muted)]">
            {offer.description || 'Explore this featured package and continue to the booking flow when ready.'}
          </p>

          <div className="flex items-center justify-between gap-4 border-t border-[var(--bccc-line)] pt-5">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
              {offer.buttonLabel || 'View Offer'}
            </span>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] transition duration-500 group-hover:border-[var(--bccc-line-gold)] group-hover:bg-[var(--bccc-gold-700)] group-hover:text-white">
              <ArrowUpRight className="h-4 w-4 transition duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function ContactPanel({ siteSettings }: { siteSettings?: SiteSettings }) {
  const openMapUrl =
    siteSettings?.openMapUrl ||
    'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines';

  return (
    <section className="relative overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl sm:p-6 lg:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,132,67,0.1),transparent_42%)]" />

      <div className="relative">
        <div className="bccc-section-kicker">
          <MapPin className="h-3.5 w-3.5" />
          Contact and Location
        </div>

        <h3 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-[var(--bccc-text)]">
          Speak with the BCCC office before reserving your event.
        </h3>

        <div className="mt-6 grid gap-3">
          <a
            href={openMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-4 transition duration-500 hover:-translate-y-0.5 hover:border-[var(--bccc-line-gold)]"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bccc-gold-700)]" />
            <span className="text-sm leading-6 text-[var(--bccc-text-muted)]">
              {siteSettings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          <a
            href={`tel:${siteSettings?.phone || '(074) 446 2009'}`}
            className="group flex items-center gap-3 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-4 transition duration-500 hover:-translate-y-0.5 hover:border-[var(--bccc-line-gold)]"
          >
            <Phone className="h-4 w-4 shrink-0 text-[var(--bccc-gold-700)]" />
            <span className="text-sm leading-6 text-[var(--bccc-text-muted)]">
              {siteSettings?.phone || '(074) 446 2009'}
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          <a
            href={`mailto:${siteSettings?.email || 'info@bccc-ease.com'}`}
            className="group flex items-center gap-3 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-4 transition duration-500 hover:-translate-y-0.5 hover:border-[var(--bccc-line-gold)]"
          >
            <Mail className="h-4 w-4 shrink-0 text-[var(--bccc-gold-700)]" />
            <span className="text-sm leading-6 text-[var(--bccc-text-muted)]">
              {siteSettings?.email || 'info@bccc-ease.com'}
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <Link
          href="/contact"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-[var(--bccc-line-gold)] bg-[var(--bccc-green-800)] px-5 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
        >
          Contact the Office
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function ClientGuideChatbot() {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hello. I am your BCCC guide. Ask me about bookings, payments, public events, venue options, time blocks, or policy reminders.',
    },
  ]);

  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const chatBodyClass = messages.length > MAX_VISIBLE_MESSAGES ? 'max-h-[360px] overflow-y-auto pr-1 bccc-hidden-scrollbar' : '';

  const sendMessage = () => {
    const trimmed = chatInput.trim();

    if (!trimmed) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: answerFor(trimmed) },
    ]);

    setChatInput('');
  };

  useEffect(() => {
    if (!chatBodyRef.current) {
      return;
    }

    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages]);

  return (
    <section className="relative overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl sm:p-6 lg:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,106,85,0.11),transparent_42%)]" />

      <div className="relative">
        <div className="bccc-section-kicker">
          <MessageCircle className="h-3.5 w-3.5" />
          Client Guide
        </div>

        <h3 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-[var(--bccc-text)]">
          Quick answers before reaching staff.
        </h3>

        <p className="mt-3 text-sm leading-7 text-[var(--bccc-text-muted)]">
          Ask about booking flow, date availability, payments, venue choices, public events, and basic policy reminders.
        </p>

        <div
          ref={chatBodyRef}
          className={cx('mt-6 space-y-3', chatBodyClass)}
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cx(
                'border p-4 text-sm leading-7',
                message.role === 'assistant'
                  ? 'border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] text-[var(--bccc-text-muted)]'
                  : 'ml-auto max-w-[88%] border-[var(--bccc-line-gold)] bg-[var(--bccc-green-800)] text-white',
              )}
            >
              {message.role === 'assistant' ? (
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
                  BCCC Guide
                </p>
              ) : null}

              {message.text}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-2">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about availability, payments, venues, or guidelines..."
            className="min-h-[3rem] min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--bccc-text)] outline-none placeholder:text-[var(--bccc-text-muted)]/55"
          />

          <button
            type="button"
            onClick={sendMessage}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--bccc-line-gold)] bg-[var(--bccc-green-800)] text-white transition hover:bg-[var(--bccc-green-900)]"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function FrequentlyAskedQuestions() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="public-section-tight">
      <div className="public-container">
        <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="bccc-section-kicker">
              <HelpCircle className="h-3.5 w-3.5" />
              Frequently Asked Questions
            </div>

            <h2 className="mt-4 bccc-section-title-sm">
              Answers to the common questions clients ask first.
            </h2>
          </div>

          <p className="bccc-section-copy lg:justify-self-end">
            Review the basic booking, payment, and schedule guidance before submitting a request.
          </p>
        </div>

        <div className="grid gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const open = openFaq === index;

            return (
              <article
                key={item.question}
                className="overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq((prev) => (prev === index ? null : index))}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                >
                  <span className="text-base font-semibold tracking-[-0.02em] text-[var(--bccc-text)]">
                    {item.question}
                  </span>

                  <ChevronDown
                    className={cx(
                      'h-5 w-5 shrink-0 text-[var(--bccc-gold-700)] transition duration-300',
                      open && 'rotate-180',
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: easeLuxury }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-[var(--bccc-line)] px-5 py-5 text-sm leading-7 text-[var(--bccc-text-muted)]">
                        {item.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function SpecialOffers({ items = [] }: { items?: FeaturePackageItem[] }) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;

  const visibleOffers = useMemo(() => items.slice(0, 10), [items]);

  return (
    <>
      <section className="public-section relative overflow-hidden">
        <div className="public-container">
          <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="bccc-section-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Special Offers
              </div>

              <h2 className="mt-4 bccc-section-title-sm">
                Featured packages and event-ready options.
              </h2>
            </div>

            <p className="bccc-section-copy lg:justify-self-end">
              Browse highlighted packages in a smooth horizontal rail, then proceed directly to booking when a package fits your event.
            </p>
          </div>

          {visibleOffers.length > 0 ? (
            <LuxuryHorizontalRail label="BCCC special offers">
              {visibleOffers.map((offer, index) => (
                <OfferCard key={offer.id} offer={offer} index={index} />
              ))}
            </LuxuryHorizontalRail>
          ) : (
            <div className="bccc-public-panel p-8 text-center">
              <p className="text-sm text-[var(--bccc-text-muted)]">
                No feature packages are visible yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="public-section-tight relative overflow-hidden">
        <div className="public-container grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <ContactPanel siteSettings={siteSettings} />
          <ClientGuideChatbot />
        </div>
      </section>

      <FrequentlyAskedQuestions />
    </>
  );
}
