import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';

type FormDataLike = {
    organization_type?: string;
    company_name?: string;
    client_name?: string;
    client_contact_number?: string;
    client_email?: string;
    survey_email?: string;
    client_address?: string;
    client_region?: string;
    client_province?: string;
    client_city_municipality?: string;
    client_barangay?: string;
    client_zip_code?: string;
    client_street_address?: string;
    head_of_organization?: string;
    type_of_event?: string;
    booking_date_from?: string;
    booking_date_to?: string;
    number_of_guests?: string;
    public_calendar_title?: string;
};

type SelectedVenueLike = {
    label?: string;
    displayLabel?: string;
    category?: string;
    capacity?: string;
    rates?: Record<string, number | string | null | undefined>;
};

type OfficialReservationPreviewProps = {
    data: FormDataLike;
    selectedVenue?: SelectedVenueLike | null;
    usage?: string;
    durationHours?: number;
    otherRentals?: string;
    additionalCharges?: number | string;
    reservationNotes?: string;
    estimatedBase?: number | string;
    estimatedTotal?: number | string;
    fullAddress?: string;
};

function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    if (!Number.isFinite(parsed)) return '₱0.00';

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(parsed);
}

function text(value: unknown, fallback = '________________'): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }

    return String(value);
}

function selectedUsageLabel(value?: string) {
    if (value === 'whole_day') return 'Whole Day';
    if (value === 'half_day') return 'Half Day';
    if (value === 'additional_hour') return 'Additional Hour';

    return 'Selected Rental';
}

function rateValue(venue: SelectedVenueLike | null | undefined, key: string) {
    return Number(venue?.rates?.[key] ?? 0);
}

function chargeLine(
    label: string,
    description: string,
    rate: number,
    active: boolean,
    amount: unknown,
) {
    return (
        <tr>
            <td>{label}</td>
            <td>{description}</td>
            <td>{money(rate)}</td>
            <td className="bccc-form-money">
                {active ? money(amount) : '₱0.00'}
            </td>
            <td>{active ? '✓' : ''}</td>
        </tr>
    );
}

export function OfficialReservationPreview({
    data,
    selectedVenue,
    usage = 'whole_day',
    durationHours = 1,
    otherRentals,
    additionalCharges = 0,
    reservationNotes,
    estimatedBase = 0,
    estimatedTotal = 0,
    fullAddress,
}: OfficialReservationPreviewProps) {
    const venueLabel = text(
        selectedVenue?.displayLabel || selectedVenue?.label,
        'Selected BCCC Area',
    );

    const wholeDayRate = rateValue(selectedVenue, 'whole_day');
    const halfDayRate = rateValue(selectedVenue, 'half_day');
    const additionalHourRate = rateValue(selectedVenue, 'additional_hour');

    return (
        <div className="bccc-preview-shell">
            <div className="bccc-preview-actions no-print">
                <div>
                    <p className="backend-booking-label">
                        Digital Form Preview
                    </p>
                    <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                        Printable Reservation Form
                    </h3>
                    <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                        This is a live preview based on the data encoded in the
                        booking wizard.
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={() => window.print()}
                    className="h-10 rounded-lg bg-[#20242b] px-4 text-sm font-semibold text-white hover:bg-[#14181d] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Form
                </Button>
            </div>

            <div className="bccc-print-root">
                <div className="bccc-form-paper">
                    <header className="bccc-form-header">
                        <div className="bccc-form-logo-mark">
                            <div className="bccc-form-roof" />
                            <div className="bccc-form-base" />
                        </div>

                        <div>
                            <p className="bccc-form-small">Reservation Form</p>
                            <h1>Baguio Convention & Cultural Center</h1>
                            <p className="bccc-form-office">
                                City Tourism, Culture and Arts Office · City
                                Government of Baguio
                            </p>
                        </div>
                    </header>

                    <Separator className="my-4" />

                    <section className="bccc-form-section">
                        <div className="bccc-form-section-title">
                            1: Event Details
                        </div>

                        <div className="bccc-form-grid">
                            <div className="bccc-form-line">
                                <span>Title:</span>
                                <strong>{text(data.type_of_event)}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Date/s:</span>
                                <strong>
                                    {text(data.booking_date_from)} to{' '}
                                    {text(data.booking_date_to)}
                                </strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Guests:</span>
                                <strong>{text(data.number_of_guests)}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Area:</span>
                                <strong>{venueLabel}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Usage:</span>
                                <strong>{selectedUsageLabel(usage)}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Public Calendar Title:</span>
                                <strong>
                                    {text(data.public_calendar_title)}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="bccc-form-section">
                        <div className="bccc-form-section-title">
                            2: Organizer
                        </div>

                        <div className="bccc-form-grid">
                            <div className="bccc-form-line">
                                <span>Organization Type:</span>
                                <strong>{text(data.organization_type)}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Organization:</span>
                                <strong>{text(data.company_name)}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Client:</span>
                                <strong>{text(data.client_name)}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Head of Organization:</span>
                                <strong>
                                    {text(data.head_of_organization)}
                                </strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Email:</span>
                                <strong>{text(data.client_email)}</strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Contact No.:</span>
                                <strong>
                                    {text(data.client_contact_number)}
                                </strong>
                            </div>

                            <div className="bccc-form-line bccc-form-line-full">
                                <span>Address:</span>
                                <strong>
                                    {text(fullAddress || data.client_address)}
                                </strong>
                            </div>

                            <div className="bccc-form-line">
                                <span>Survey Email:</span>
                                <strong>{text(data.survey_email)}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="bccc-form-section">
                        <div className="bccc-form-section-title">
                            3: Rental Assessment
                        </div>

                        <table className="bccc-form-rates">
                            <thead>
                                <tr>
                                    <th>Rental Type</th>
                                    <th>Description</th>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                    <th>Selected</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chargeLine(
                                    'Whole Day',
                                    venueLabel,
                                    wholeDayRate,
                                    usage === 'whole_day',
                                    estimatedBase,
                                )}
                                {chargeLine(
                                    'Half Day',
                                    venueLabel,
                                    halfDayRate,
                                    usage === 'half_day',
                                    estimatedBase,
                                )}
                                {chargeLine(
                                    durationHours
                                        ? `${durationHours} hour(s)`
                                        : 'Additional Hour',
                                    venueLabel,
                                    additionalHourRate,
                                    usage === 'additional_hour',
                                    estimatedBase,
                                )}

                                <tr>
                                    <td>Other Rentals</td>
                                    <td>
                                        {text(otherRentals, 'None declared')}
                                    </td>
                                    <td>Assessment</td>
                                    <td className="bccc-form-money">—</td>
                                    <td />
                                </tr>

                                <tr>
                                    <td>Additional Charges</td>
                                    <td>Subject to assessment</td>
                                    <td>Assessment</td>
                                    <td className="bccc-form-money">
                                        {money(additionalCharges)}
                                    </td>
                                    <td />
                                </tr>

                                <tr className="bccc-form-subtotal-row">
                                    <td colSpan={3}>Estimated Total</td>
                                    <td className="bccc-form-money">
                                        {money(estimatedTotal)}
                                    </td>
                                    <td />
                                </tr>
                            </tbody>
                        </table>

                        <div className="bccc-form-note-box">
                            <span>Notes:</span>
                            <strong>
                                {text(
                                    reservationNotes,
                                    'Additional charges may be imposed after assessment at egress. The City has the right to bump off reservations depending on reservation status.',
                                )}
                            </strong>
                        </div>
                    </section>

                    <section className="bccc-form-section bccc-form-compact-rules">
                        <div className="bccc-form-section-title">
                            4: Booking Reminders
                        </div>

                        <ul>
                            <li>
                                A written contract is required for all rentable
                                areas.
                            </li>
                            <li>
                                Down payment and payment compliance are subject
                                to official BCCC validation.
                            </li>
                            <li>
                                Full payment must be settled before ingress,
                                subject to separate billing statement.
                            </li>
                            <li>
                                Organizers must seek clearance from BCCC
                                administration prior to ingress.
                            </li>
                            <li>
                                All items and equipment brought inside the
                                facility must be declared for review and
                                approval.
                            </li>
                            <li>
                                Additional charges may be imposed after
                                assessment at egress.
                            </li>
                        </ul>
                    </section>

                    <section className="bccc-form-signatures">
                        <div>
                            <p>Assessed by:</p>
                            <div className="bccc-signature-line" />
                            <strong>Ian Catacutan</strong>
                            <span>Reservations</span>
                        </div>

                        <div>
                            <p>Conforme:</p>
                            <div className="bccc-signature-line" />
                            <strong>
                                {text(
                                    data.client_name,
                                    'Client / Authorized Representative',
                                )}
                            </strong>
                            <span>Signature over printed name</span>
                        </div>

                        <div>
                            <p>Recommending Approval:</p>
                            <div className="bccc-signature-line" />
                            <strong>Engr. Aloysius C. Mapalo</strong>
                            <span>City Tourism Officer</span>
                        </div>

                        <div>
                            <p>Approved by:</p>
                            <div className="bccc-signature-line" />
                            <strong>Vittorio Jerico L. Cawis</strong>
                            <span>City Administrator</span>
                        </div>
                    </section>

                    <footer className="bccc-form-footer">
                        <strong>City Tourism, Culture and Arts Office</strong>
                        <span>
                            (074) 446-2009 · Globe (+63) 956 572 9097 · Smart
                            (+63) 960 200 9679 · www.baguio.gov.ph
                        </span>
                    </footer>
                </div>
            </div>
        </div>
    );
}
