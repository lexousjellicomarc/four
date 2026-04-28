import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DoorOpen, ClipboardList, Users, PhoneCall, AlertTriangle, Info } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Guidelines & Contacts', href: '/guidelines' }];

const VENUE_QUICK_REF: Array<{
  area: string;
  allowedUse: string;
  capacity: string;
}> = [
  {
    area: 'Full Hall',
    allowedUse: 'Meetings/Congress • Conferences/Conventions • Shows/Concerts • Assemblies/Ceremonies',
    capacity: '2,000 (theater) • 1,700 (with training tables)',
  },
  {
    area: 'Ground Hall',
    allowedUse: 'Ball/Dance/Functions • Dining • Small Shows/Ceremonies • Small Conference',
    capacity: '800 (theater) • 500 (with training tables) • 400 (with dining tables)',
  },
  {
    area: 'Executive Lounge',
    allowedUse: 'Small meetings • Lounge/Holding room',
    capacity: '25 (with furniture)',
  },
  {
    area: 'Executive Boardroom',
    allowedUse: 'Small meetings • Training/Lecture',
    capacity: '30 (boardroom setup)',
  },
  {
    area: 'Lobby Receiving Room (Admin Office)',
    allowedUse: 'Meetings • Training/Lecture • Small exhibits/gallery',
    capacity: '50 (training setup)',
  },
  {
    area: 'Basement Function Room',
    allowedUse: 'Meetings • Training/Lecture',
    capacity: '70 (training setup)',
  },
  {
    area: 'Basement Hall (Half)',
    allowedUse: 'Meetings/Training • Dining • Exhibits/Gallery • Assemblies/Ceremonies',
    capacity: '300 (training) • 150 (dining)',
  },
  {
    area: 'Whole Basement',
    allowedUse: 'Meetings/Congress • Conventions • Dining • Training/Rehearsals • Exhibits/Expos • Art shows • Assemblies',
    capacity: '1,200 (theater) • 800 (with training tables) • 600 (with dining tables)',
  },
];

export default function Guidelines() {
  const { auth } = usePage().props as any;
  const rawRoles = auth?.user?.roles ?? [];
  const roleNames = Array.isArray(rawRoles) ? rawRoles.map((r: any) => (typeof r === 'string' ? r : r.name)) : [];

  const isClient = roleNames.includes('user');
  const isStaff = !isClient && !!auth?.user;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Guidelines & Contacts" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Page header / role hint */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Baguio Convention &amp; Cultural Center Guidelines</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Please review these guidelines before your event. They cover ingress &amp; egress, house rules, booking terms
              (payment/bond/cancellation), and official contact details.
            </p>

            {/* Quick jump links */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="#policies">
                  <Info className="mr-2 h-3 w-3" />
                  Booking Policies
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="#contacts">
                  <PhoneCall className="mr-2 h-3 w-3" />
                  Contacts
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="#venue-quick-ref">
                  <ClipboardList className="mr-2 h-3 w-3" />
                  Venue Quick Reference
                </a>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isClient && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-300">
                You are viewing this as a&nbsp;<span className="font-semibold">Client / Organizer</span>
              </Badge>
            )}
            {isStaff && (
              <Badge variant="outline" className="border-sky-500 text-sky-700 dark:text-sky-300">
                You are viewing this as&nbsp;<span className="font-semibold">Staff / Admin</span>
              </Badge>
            )}
            {!auth?.user && (
              <Badge variant="outline" className="border-slate-500">
                Public view
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr]">
          {/* Left column – rules + policies */}
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <DoorOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">1. Ingress &amp; Egress Protocol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {isClient && (
                  <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    <AlertTriangle className="mr-1 inline h-3 w-3" /> As an organizer, please coordinate these items with BCC
                    staff <strong>before your event date</strong>.
                  </p>
                )}
                {isStaff && (
                  <p className="rounded-md bg-sky-50 p-2 text-xs text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                    Internal note: use these points when confirming ingress / egress details with clients in their booking record.
                  </p>
                )}
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Organizers <strong>must seek clearance</strong> from BCC administration prior to ingress.
                  </li>
                  <li>
                    All items and equipment to be brought inside the facility must be declared with the secretariat for review and approval.
                  </li>
                  <li>Setup of decors, technical, secretariat and catering must be with prior arrangement with BCC administration.</li>
                  <li>
                    Inform the BCC secretariat of your expected <strong>time of egress</strong> for monitoring and assessment.
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* House rules for organizers */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <ClipboardList className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">2. House Rules for Organizers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Full payment</strong> must be settled before ingress (refer to the separate billing statement).
                  </li>
                  <li>
                    Setting up booths for exhibits, merchandizing or selling is <strong>prohibited</strong> unless with prior arrangement with BCCC administration.
                  </li>
                  <li>
                    Avoid damage or marring of any surface, fixture, furniture or equipment of the facility. Any damage will be charged to the organizers.
                  </li>
                  <li>
                    Observe environmentally friendly practices such as: limited or no use of plastics and tarpaulins, using recycled packaging or eco‑bags,
                    sourcing from local suppliers and local produce, and proper trash segregation.
                  </li>
                  <li>Play reminder videos and Baguio AVPs before and during the activity when applicable.</li>
                </ul>

                {isStaff && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tip: you may reflect payment status in the booking (<em>Unpaid / Partial / Paid</em>) once these conditions are met.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* House rules for participants */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  3. House Rules for Participants
                  <span className="ml-1 text-xs text-muted-foreground">(to be strictly observed by all)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>No smoking</strong> at all times in all areas, including outdoor and parking spaces.
                  </li>
                  <li>
                    Observe <strong>clean‑as‑you‑go</strong>. Trash and garbage must be disposed properly in designated bins.
                  </li>
                  <li>Bringing in food and beverage is limited to those distributed by the official caterer.</li>
                  <li>Avoid noise and unnecessary movement during programs and proceedings. Put all electronic gadgets on silent mode.</li>
                  <li>Follow proper dress code and wear IDs as prescribed by the organizer.</li>
                  <li>Be aware of emergency exits, emergency contacts, health advisories and evacuation protocol.</li>
                  <li>Save water and energy. Use water, soap and tissue prudently.</li>
                  <li>
                    BCC management is <strong>not liable</strong> for loss or damage of personal belongings. Keep valuables secure.
                  </li>
                  <li>
                    Illegal substances or paraphernalia, deadly weapons and animals/pets are <strong>strictly prohibited</strong>.
                  </li>
                  <li>For any concern, seek assistance at the information booth.</li>
                  <li>Follow minimum health and safety protocols such as wearing of face masks (when required) and social distancing.</li>
                  <li>Temperature checking may be conducted during registration.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Booking terms / policies (payment, bond, cancellation, providers) */}
            <Card id="policies">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Info className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">4. Booking Terms, Payments &amp; Cancellation Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  This section is a plain-language summary of key policies from the BCCC Operations Manual (City Ordinance No. 041, Series of 2022).
                  Final assessment and approval are handled by the Secretariat. If anything here conflicts with your official billing/contract, the official
                  documents apply.
                </p>

                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reservation &amp; Payment</div>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Booking requests may be temporarily held (often “pencil‑booked”), but the schedule is considered <strong>reserved</strong> once the required
                      payment is made.
                    </li>
                    <li>
                      <strong>50% down payment</strong> is required to consider the date and venue completely reserved (first‑paid, first‑reserved).
                    </li>
                    <li>
                      The <strong>remaining balance</strong> should be paid in full <strong>prior to the event/ingress</strong>.
                    </li>
                    <li>
                      Any <strong>additional charges</strong> (e.g., overtime, add‑ons, damages) are typically payable within <strong>3 days</strong> from issuance of the bill of additional charges.
                    </li>
                    <li>
                      If your event involves <strong>ticket selling</strong> or <strong>paid registration</strong>, make sure you comply with required permits and applicable taxes.
                    </li>
                  </ul>
                </div>

                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bond / Security Deposit</div>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      A <strong>₱10,000 bond</strong> (security deposit) is required prior to the start of the event to cover possible additional expenses.
                    </li>
                    <li>
                      The bond is returned upon issuance of the final bill (or applied to any additional charges, when applicable).
                    </li>
                  </ul>
                </div>

                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cancellation</div>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>No cancellation charge if cancelled at least <strong>2 weeks</strong> before the event date.</li>
                    <li>
                      Cancellation <strong>within 2 weeks</strong> may incur an administrative fee (commonly <strong>20%</strong> of the total venue fee).
                    </li>
                    <li>
                      Cancellation <strong>within 1 week</strong> may incur a higher administrative fee (commonly <strong>30%</strong> of the total venue fee).
                    </li>
                    <li>
                      Cancellation <strong>after office hours the day before</strong> or <strong>on the day of the event</strong> may incur a significant fee (commonly <strong>75%</strong> of the total venue fee).
                    </li>
                  </ul>
                </div>

                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accredited Providers / Outsourced Services</div>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      If you outsource special services (e.g., catering, technical riders, stage setup/styling, event management, documentation), you may be
                      required to use <strong>accredited providers</strong>.
                    </li>
                    <li>
                      Materials/equipment brought in should be declared ahead of time, and all personnel must follow facility house rules.
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                  Tip: You will be asked to confirm acceptance of these policies in the booking submission popup.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column – contacts & quick info */}
          <div className="grid gap-4">
            <Card id="contacts">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <PhoneCall className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">5. Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <section className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City Tourism &amp; Special Events Office</p>
                  <p className="font-medium">Engr. Aloysius C. Mapalo</p>
                  <p className="text-xs text-muted-foreground">Supervising Tourism Operations Officer</p>
                  <p>
                    Email:{' '}
                    <a href="mailto:alecmapalo@gmail.com" className="text-primary underline underline-offset-2">
                      alecmapalo@gmail.com
                    </a>
                  </p>
                  <p>
                    Mobile:{' '}
                    <a href="tel:+639175068528" className="text-primary underline underline-offset-2">
                      0917 506 8528
                    </a>
                  </p>
                </section>

                <Separator />

                <section className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Baguio Convention Center Secretariat</p>
                  <p className="font-medium">Mr. Ian Lyle B. Catacutan</p>
                  <p>
                    Landline:{' '}
                    <a href="tel:+63442462009" className="text-primary underline underline-offset-2">
                      (074) 446 2009
                    </a>
                  </p>
                  <p>
                    Mobile:{' '}
                    <a href="tel:+639616703371" className="text-primary underline underline-offset-2">
                      0961 670 3371
                    </a>
                  </p>
                </section>

                <Separator />

                <p className="text-xs text-muted-foreground">
                  For urgent matters on the day of your event (e.g. ingress issues, technical concerns), contact the <strong>Secretariat</strong> first.
                  For tourism‑related matters and special events coordination, contact the <strong>City Tourism &amp; Special Events Office</strong>.
                </p>

                <div className="grid gap-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/bookings/create">
                      <Info className="mr-2 h-3 w-3" />
                      Go to Booking Form
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href="#policies">
                      <ClipboardList className="mr-2 h-3 w-3" />
                      Jump to Booking Policies
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">6. How these guidelines work with your online booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    When you create a booking, the system automatically enforces <strong>minimum slot blocks</strong> and checks for schedule conflicts.
                  </li>
                  <li>
                    Ingress and egress times are included in the selected time window and will be finalized with the Secretariat based on your schedule.
                  </li>
                  <li>
                    Clients (user accounts) can view their bookings, update contact details and add payments, but <strong>cannot override</strong> booking status or policy requirements.
                  </li>
                  <li>Staff, managers and admins can adjust booking schedules, statuses and payment details according to official guidelines.</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="venue-quick-ref">
              <CardHeader>
                <CardTitle className="text-base">7. Venue Quick Reference</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs md:text-sm text-muted-foreground">
                <p>
                  A quick summary of common spaces and typical capacities. Actual setup/capacity depends on layout and must be confirmed with the Secretariat.
                </p>

                <div className="overflow-x-auto rounded-md border bg-background">
                  <table className="w-full min-w-[520px] text-left text-[12px]">
                    <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Area</th>
                        <th className="px-3 py-2">Allowed use (summary)</th>
                        <th className="px-3 py-2">Typical capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {VENUE_QUICK_REF.map((r) => (
                        <tr key={r.area} className="border-t">
                          <td className="px-3 py-2 font-medium text-foreground">{r.area}</td>
                          <td className="px-3 py-2">{r.allowedUse}</td>
                          <td className="px-3 py-2">{r.capacity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px]">
                  Need help choosing a venue? Contact the Secretariat and share your expected guest count, event type, and preferred layout (theater / training / dining).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
