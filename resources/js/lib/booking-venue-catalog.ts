export type BookingUsageKey = 'whole_day' | 'half_day' | 'additional_hour';

export type BookingVenueKey =
    | 'FULL_HALL'
    | 'MAIN_HALL'
    | 'LED_WALL'
    | 'VIP_LOUNGE'
    | 'BOARD_ROOM';

export type BookingRateSet = {
    whole_day: number;
    half_day: number;
    additional_hour: number;
};

export type BookingVenueCatalogItem = {
    key: BookingVenueKey;
    label: string;
    displayLabel: string;
    subtitle: string;
    category: 'package' | 'individual';
    image: string;
    fallbackClass: string;
    description: string;
    longDescription: string;
    capacity: string;
    rates: BookingRateSet;
    includes: string[];
    amenities: string[];
    idealFor: string[];
    backendRequirements: string[];
    guidelines: string[];
    searchNames: string[];
};

export const BOOKING_USAGE_LABELS: Record<BookingUsageKey, string> = {
    whole_day: 'Whole Day',
    half_day: 'Half Day',
    additional_hour: 'Additional Hour',
};

export const BOOKING_VENUE_CATALOG: BookingVenueCatalogItem[] = [
    {
        key: 'FULL_HALL',
        label: 'FULL HALL',
        displayLabel: 'Full Hall Package',
        subtitle: 'Complete BCCC reservation package',
        category: 'package',
        image: '/images/booking/full-hall.jpg',
        fallbackClass:
            'bg-[radial-gradient(circle_at_18%_15%,rgba(201,169,106,0.32),transparent_34%),linear-gradient(135deg,#11100c_0%,#3b2b18_48%,#0b0b09_100%)]',
        description:
            'The complete package for major conventions, large programs, exhibits, ceremonies, and full-scale public or private events.',
        longDescription:
            'Full Hall is the most complete booking package. It should be used when the event requires the main convention space together with major support areas. For this system, Full Hall clearly includes Main Hall, LED Wall, VIP Lounge, and Board Room as one complete package.',
        capacity: 'Full convention capacity',
        rates: {
            whole_day: 80000,
            half_day: 45000,
            additional_hour: 5000,
        },
        includes: ['MAIN HALL', 'LED WALL', 'VIP LOUNGE', 'BOARD ROOM'],
        amenities: [
            'Complete convention setup',
            'Main program area',
            'LED wall support',
            'VIP holding area',
            'Board room support space',
            'Best for large attendance',
        ],
        idealFor: [
            'Conventions',
            'Exhibits',
            'City events',
            'Awarding ceremonies',
            'Corporate launches',
        ],
        backendRequirements: [
            'Must match an active backend Rental Option named FULL HALL.',
            'Requires event title/type, selected date/s, and organizer details.',
            'Requires contact person and contact number.',
            'Requires usage selection: Whole Day, Half Day, or Additional Hour.',
            'Requires estimated duration for additional-hour charging.',
            'Requires final review before submission.',
        ],
        guidelines: [
            'Full payment must be settled before ingress, subject to billing assessment.',
            'Setup of decors, technical, secretariat, and catering must be arranged with BCCC administration.',
            'All items and equipment brought inside the facility must be declared for review and approval.',
            'Avoid damage or marring of surfaces, fixtures, furniture, and equipment.',
        ],
        searchNames: [
            'FULL HALL',
            'FULLHALL',
            'FULL-HALL',
            'ENTIRE HALL',
            'WHOLE HALL',
        ],
    },
    {
        key: 'MAIN_HALL',
        label: 'MAIN HALL',
        displayLabel: 'Main Hall',
        subtitle: 'Primary event venue',
        category: 'individual',
        image: '/images/booking/main-hall.jpg',
        fallbackClass:
            'bg-[radial-gradient(circle_at_18%_15%,rgba(201,169,106,0.24),transparent_34%),linear-gradient(135deg,#15120d_0%,#5f3c1d_48%,#11100c_100%)]',
        description:
            'Primary hall space for conferences, programs, ceremonies, seminars, and audience-centered events.',
        longDescription:
            'Main Hall is the main rentable event space when the organizer needs a formal program venue but does not need the complete Full Hall package.',
        capacity: 'Large audience setup',
        rates: {
            whole_day: 60000,
            half_day: 35000,
            additional_hour: 5000,
        },
        includes: ['MAIN HALL ACCESS'],
        amenities: [
            'Formal event layout',
            'Audience-centered setup',
            'Large program area',
            'Suitable for ceremonies and seminars',
        ],
        idealFor: ['Seminars', 'Conferences', 'Ceremonies', 'Formal programs'],
        backendRequirements: [
            'Must match an active backend Rental Option named MAIN HALL.',
            'Requires event schedule and organizer information.',
            'Requires usage and duration selection.',
            'Subject to availability and backend calendar validation.',
        ],
        guidelines: [
            'Observe clean-as-you-go.',
            'Food and beverage must follow official catering restrictions.',
            'Avoid unnecessary noise and movement during programs.',
            'Participants must follow organizer dress code and ID requirements.',
        ],
        searchNames: ['MAIN HALL', 'MAINHALL', 'MAIN-HALL'],
    },
    {
        key: 'LED_WALL',
        label: 'LED WALL',
        displayLabel: 'LED Wall',
        subtitle: 'Premium display support',
        category: 'individual',
        image: '/images/booking/led-wall.jpg',
        fallbackClass:
            'bg-[radial-gradient(circle_at_18%_15%,rgba(31,110,115,0.38),transparent_34%),linear-gradient(135deg,#0b1111_0%,#1f4f55_48%,#0d0d0b_100%)]',
        description:
            'Premium visual display support for presentations, branding, program backgrounds, launches, and ceremonies.',
        longDescription:
            'LED Wall is for organizers who need digital display support for presentations, stage visuals, sponsor loops, event branding, or ceremonial program visuals.',
        capacity: 'Display support',
        rates: {
            whole_day: 30000,
            half_day: 15000,
            additional_hour: 3500,
        },
        includes: ['LED WALL USE'],
        amenities: [
            'Presentation display support',
            'Branding display',
            'Stage visual enhancement',
            'Suitable for major program visuals',
        ],
        idealFor: ['Presentations', 'Branding', 'Stage visuals', 'Launches'],
        backendRequirements: [
            'Must match an active backend Rental Option named LED WALL.',
            'Requires schedule and usage selection.',
            'Should be checked against other active bookings before confirmation.',
        ],
        guidelines: [
            'All technical setup must be coordinated with BCCC administration.',
            'Play reminder videos and Baguio AVPs before and during the activity when required.',
            'Electronic equipment must be declared for review and approval.',
        ],
        searchNames: ['LED WALL', 'LEDWALL', 'LED-WALL', 'LED'],
    },
    {
        key: 'VIP_LOUNGE',
        label: 'VIP LOUNGE',
        displayLabel: 'VIP Lounge',
        subtitle: 'Executive holding area',
        category: 'individual',
        image: '/images/booking/vip-lounge.jpg',
        fallbackClass:
            'bg-[radial-gradient(circle_at_18%_15%,rgba(232,216,181,0.25),transparent_34%),linear-gradient(135deg,#15120d_0%,#3e3022_48%,#0d0d0b_100%)]',
        description:
            'Executive support space for dignitaries, guests of honor, speakers, protocol preparation, and private waiting.',
        longDescription:
            'VIP Lounge is best used as a private support area for important guests, speakers, dignitaries, program officials, or protocol-sensitive activities.',
        capacity: 'Executive guest area',
        rates: {
            whole_day: 6000,
            half_day: 3500,
            additional_hour: 500,
        },
        includes: ['VIP LOUNGE ACCESS'],
        amenities: [
            'Private waiting area',
            'Executive support space',
            'Speaker preparation',
            'Protocol support',
        ],
        idealFor: ['VIP guests', 'Speakers', 'Protocol', 'Private holding'],
        backendRequirements: [
            'Must match an active backend Rental Option named VIP LOUNGE.',
            'Requires event schedule and organizer details.',
            'Requires usage and duration selection.',
        ],
        guidelines: [
            'Only authorized guests should access the lounge area.',
            'Organizer is responsible for participant control and proper use of the area.',
            'BCCC management is not responsible for loss or damage of personal belongings.',
        ],
        searchNames: [
            'VIP LOUNGE',
            'VIP',
            'LOUNGE',
            'HOLDING AREA',
            'VIP HOLDING',
        ],
    },
    {
        key: 'BOARD_ROOM',
        label: 'BOARD ROOM',
        displayLabel: 'Board Room',
        subtitle: 'Private meeting space',
        category: 'individual',
        image: '/images/booking/board-room.jpg',
        fallbackClass:
            'bg-[radial-gradient(circle_at_18%_15%,rgba(49,92,77,0.42),transparent_34%),linear-gradient(135deg,#0c1511_0%,#315c4d_48%,#0d0d0b_100%)]',
        description:
            'Private meeting room for briefings, committees, planning sessions, consultations, and focused discussions.',
        longDescription:
            'Board Room is intended for smaller formal meetings and planning sessions that require a private, organized, and professional discussion space.',
        capacity: 'Small meeting setup',
        rates: {
            whole_day: 6000,
            half_day: 3500,
            additional_hour: 500,
        },
        includes: ['BOARD ROOM ACCESS'],
        amenities: [
            'Private meeting layout',
            'Executive table setup',
            'Focused discussion space',
            'Briefing-ready room',
        ],
        idealFor: ['Meetings', 'Briefings', 'Planning', 'Committees'],
        backendRequirements: [
            'Must match an active backend Rental Option named BOARD ROOM.',
            'Requires event schedule and organizer details.',
            'Requires usage and duration selection.',
        ],
        guidelines: [
            'Observe clean-as-you-go.',
            'Turn off or put electronic gadgets in silent mode during formal meetings.',
            'Save water and energy; use supplies prudently.',
        ],
        searchNames: ['BOARD ROOM', 'BOARDROOM', 'BOARD-ROOM'],
    },
];

export const BCCC_BOOKING_GENERAL_GUIDELINES = [
    {
        title: 'Ingress and Egress Protocol',
        items: [
            'Organizers must seek clearance from BCCC administration prior to ingress.',
            'All items and equipment brought inside must be declared with the secretariat for review and approval.',
            'Setup of decors, technical, secretariat, and catering must be arranged with BCCC administration.',
            'Inform the BCCC secretariat of egress time for monitoring and assessment.',
        ],
    },
    {
        title: 'House Rules for Organizers',
        items: [
            'Full payment must be settled before ingress, subject to the billing statement.',
            'Booths, exhibits, merchandising, or selling require prior arrangement with BCCC administration.',
            'Avoid damage or marring of any surface, fixture, furniture, or equipment.',
            'Observe environmentally friendly practices such as reduced plastic use and proper waste segregation.',
            'Play reminder videos and Baguio AVPs before and during the activity when required.',
        ],
    },
    {
        title: 'House Rules for Participants',
        items: [
            'No smoking at all times in all areas, including outdoor and parking spaces.',
            'Observe clean-as-you-go and dispose of trash in designated bins.',
            'Food and beverage must follow official caterer restrictions.',
            'Avoid noise and unnecessary movement during the program.',
            'Wear proper dress code and IDs as prescribed by the organizer.',
            'Be aware of emergency exits, emergency contacts, advisories, and evacuation protocol.',
            'Illegal substances, deadly weapons, animals, and pets are strictly prohibited.',
            'For concerns, seek assistance at the information booth.',
        ],
    },
];

export function normalizeVenueText(value: unknown): string {
    return String(value ?? '')
        .toUpperCase()
        .replace(/&/g, 'AND')
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function catalogItemMatchesService(
    item: BookingVenueCatalogItem,
    serviceName: unknown,
): boolean {
    const normalizedService = normalizeVenueText(serviceName);

    if (!normalizedService) {
        return false;
    }

    return item.searchNames.some(
        (name) => normalizeVenueText(name) === normalizedService,
    );
}

export function estimateVenueCharge(
    item: BookingVenueCatalogItem | undefined,
    usage: BookingUsageKey,
    durationHours: number,
): number {
    if (!item) return 0;

    if (usage === 'additional_hour') {
        return item.rates.additional_hour * Math.max(durationHours, 1);
    }

    return item.rates[usage];
}
