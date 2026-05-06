export type OfferItem = {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    lightImage: string;
    darkImage: string;
    buttonLabel: string;
    href: string;
};

export const offers: OfferItem[] = [
    {
        title: 'Convention Package',
        subtitle: 'For conferences, summits, and large formal gatherings.',
        description:
            'Ideal for bigger audience setups that need coordinated space planning, attendee flow, and venue presence.',
        image: '/marketing/images/offers/meeting-package.jpg',
        lightImage: '/marketing/images/offers/meeting-package.jpg',
        darkImage: '/marketing/images/offers/meeting-package.jpg',
        buttonLabel: 'Ask About This Package',
        href: '/contact',
    },
    {
        title: 'Exhibit Package',
        subtitle:
            'For showcase booths, public displays, and gallery-style activations.',
        description:
            'Designed for product exhibits, cultural showcases, and public-facing installations requiring flexible layout.',
        image: '/marketing/images/offers/exhibit-package.jpg',
        lightImage: '/marketing/images/offers/exhibit-package.jpg',
        darkImage: '/marketing/images/offers/exhibit-package.jpg',
        buttonLabel: 'View Offer',
        href: '/contact',
    },
    {
        title: 'Meeting & Boardroom Package',
        subtitle: 'For executive meetings, workshops, and planning sessions.',
        description:
            'Best suited for focused coordination, discussions, and smaller formal programs needing a refined environment.',
        image: '/marketing/images/offers/meeting-package.jpg',
        lightImage: '/marketing/images/offers/meeting-package.jpg',
        darkImage: '/marketing/images/offers/meeting-package.jpg',
        buttonLabel: 'Request Details',
        href: '/contact',
    },
    {
        title: 'Cultural Program Package',
        subtitle:
            'For performances, heritage nights, and audience-centered cultural features.',
        description:
            'A good fit for public cultural showcases, performance support, and community-oriented venue programming.',
        image: '/marketing/images/offers/exhibit-package.jpg',
        lightImage: '/marketing/images/offers/exhibit-package.jpg',
        darkImage: '/marketing/images/offers/exhibit-package.jpg',
        buttonLabel: 'Inquire Now',
        href: '/contact',
    },
];
