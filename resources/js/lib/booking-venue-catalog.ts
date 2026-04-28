export type BookingVenueKey =
  | 'FULL_HALL'
  | 'MAIN_HALL'
  | 'LED_WALL'
  | 'VIP_LOUNGE'
  | 'BOARD_ROOM';

export type BookingVenueCatalogItem = {
  key: BookingVenueKey;
  label: string;
  displayLabel: string;
  subtitle: string;
  category: 'package' | 'individual';
  image: string;
  fallbackClass: string;
  description: string;
  capacity: string;
  tag?: string;
  includes: string[];
  idealFor: string[];
  searchNames: string[];
};

export const BOOKING_VENUE_CATALOG: BookingVenueCatalogItem[] = [
  {
    key: 'FULL_HALL',
    label: 'FULL HALL',
    displayLabel: 'Full Hall Package',
    subtitle: 'Exclusive · All spaces included',
    category: 'package',
    image: '/images/booking/full-hall.jpg',
    fallbackClass:
      'bg-[radial-gradient(circle_at_18%_14%,rgba(223,190,122,0.32),transparent_34%),linear-gradient(135deg,#0c0c0a_0%,#3a2a18_42%,#111827_100%)]',
    description:
      'The complete convention experience. Reserve the entire venue package with Main Hall, LED Wall, VIP Lounge, and Board Room included in one premium reservation.',
    capacity: 'Full convention capacity',
    tag: 'Best Value',
    includes: ['MAIN HALL', 'LED WALL', 'VIP LOUNGE', 'BOARD ROOM'],
    idealFor: ['Conventions', 'Exhibitions', 'Large ceremonies', 'City events'],
    searchNames: ['FULL HALL', 'FULLHALL', 'FULL-HALL', 'ENTIRE HALL', 'WHOLE HALL'],
  },
  {
    key: 'MAIN_HALL',
    label: 'MAIN HALL',
    displayLabel: 'Main Hall',
    subtitle: 'Grand events · Primary venue',
    category: 'individual',
    image: '/images/booking/main-hall.jpg',
    fallbackClass:
      'bg-[radial-gradient(circle_at_18%_14%,rgba(198,165,90,0.28),transparent_34%),linear-gradient(135deg,#111827_0%,#5f3718_48%,#0c0c0a_100%)]',
    description:
      'The main event space for conferences, formal programs, seminars, ceremonies, and audience-centered gatherings.',
    capacity: 'Large audience setup',
    includes: ['MAIN HALL ACCESS'],
    idealFor: ['Seminars', 'Conferences', 'Ceremonies', 'Programs'],
    searchNames: ['MAIN HALL', 'MAINHALL', 'MAIN-HALL'],
  },
  {
    key: 'LED_WALL',
    label: 'LED WALL',
    displayLabel: 'LED Wall',
    subtitle: 'Immersive · Premium display',
    category: 'individual',
    image: '/images/booking/led-wall.jpg',
    fallbackClass:
      'bg-[radial-gradient(circle_at_22%_18%,rgba(122,170,232,0.28),transparent_34%),linear-gradient(135deg,#07111f_0%,#0d4b70_48%,#0c0c0a_100%)]',
    description:
      'Premium visual display support for presentations, stage visuals, product launches, branding, and high-impact event media.',
    capacity: 'Display add-on',
    includes: ['LED WALL USE'],
    idealFor: ['Presentations', 'Branding', 'Stage visuals', 'Launches'],
    searchNames: ['LED WALL', 'LEDWALL', 'LED-WALL', 'LED'],
  },
  {
    key: 'VIP_LOUNGE',
    label: 'VIP LOUNGE',
    displayLabel: 'VIP Lounge',
    subtitle: 'Private · Executive holding',
    category: 'individual',
    image: '/images/booking/vip-lounge.jpg',
    fallbackClass:
      'bg-[radial-gradient(circle_at_22%_18%,rgba(180,140,255,0.25),transparent_34%),linear-gradient(135deg,#18120f_0%,#4a235f_50%,#0c0c0a_100%)]',
    description:
      'An intimate executive space for dignitaries, speakers, guests of honor, private waiting, and protocol preparation.',
    capacity: 'Executive guest area',
    includes: ['VIP LOUNGE ACCESS'],
    idealFor: ['VIP guests', 'Speakers', 'Protocol', 'Private holding'],
    searchNames: ['VIP LOUNGE', 'VIP', 'HOLDING AREA', 'VIP HOLDING', 'HOLDING AREA VIP'],
  },
  {
    key: 'BOARD_ROOM',
    label: 'BOARD ROOM',
    displayLabel: 'Board Room',
    subtitle: 'Executive · Private meeting',
    category: 'individual',
    image: '/images/booking/board-room.jpg',
    fallbackClass:
      'bg-[radial-gradient(circle_at_22%_18%,rgba(114,191,148,0.25),transparent_34%),linear-gradient(135deg,#0b2a20_0%,#0f4c43_48%,#0c0c0a_100%)]',
    description:
      'A polished meeting room for planning sessions, briefings, executive meetings, committees, and focused discussions.',
    capacity: 'Small meeting setup',
    includes: ['BOARD ROOM ACCESS'],
    idealFor: ['Meetings', 'Briefings', 'Planning', 'Committees'],
    searchNames: ['BOARD ROOM', 'BOARDROOM', 'BOARD-ROOM'],
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

  return item.searchNames.some((name) => normalizeVenueText(name) === normalizedService);
}
