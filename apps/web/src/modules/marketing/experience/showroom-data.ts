/**
 * Data model for the 3D showroom. A brokerage occupies one "bay" (a wall/room)
 * whose murals are its listings. Listing images come from real published
 * listings when available; otherwise a tasteful placeholder panel is shown
 * (never a fake photo that leads nowhere).
 */

export type ShowroomListing = {
  id: string;
  title: string;
  priceLabel: string;
  meta: string; // e.g. "3 bd · 2 ba · 1,842 sqft"
  city: string;
  /** Real image URL when available; null renders a placeholder panel. */
  imageUrl: string | null;
  /** When true, the mural shows a "Sold / Leased" state instead of a CTA. */
  closed?: boolean;
};

export type ShowroomBrokerage = {
  id: string;
  name: string;
  tagline: string;
  /** Accent color (hex) used for the bay's lighting and framing. */
  accent: string;
  listings: ShowroomListing[];
};

/**
 * Curated demo brokerages used until real brokerages publish listings. The
 * murals are stylized panels (no fake photography); they are replaced by real
 * listing images as soon as a brokerage publishes them.
 */
export const DEMO_BROKERAGES: ShowroomBrokerage[] = [
  {
    id: "summit-realty",
    name: "Summit Realty Group",
    tagline: "Denver · Boulder · Front Range",
    accent: "#7dd3fc",
    listings: [
      {
        id: "s1",
        title: "Charming Bungalow on Pearl St",
        priceLabel: "$625,000",
        meta: "3 bd · 2 ba · 1,842 sqft",
        city: "Boulder, CO",
        imageUrl: null,
      },
      {
        id: "s2",
        title: "Downtown Condo, Skyline Views",
        priceLabel: "$489,000",
        meta: "2 bd · 2 ba · 1,180 sqft",
        city: "Denver, CO",
        imageUrl: null,
      },
      {
        id: "s3",
        title: "Townhome near Wash Park",
        priceLabel: "$715,000",
        meta: "3 bd · 3.5 ba · 2,100 sqft",
        city: "Denver, CO",
        imageUrl: null,
      },
      {
        id: "s4",
        title: "Mountain-View Ranch",
        priceLabel: "$679,000",
        meta: "4 bd · 3 ba · 2,250 sqft",
        city: "Golden, CO",
        imageUrl: null,
        closed: true,
      },
    ],
  },
  {
    id: "front-range",
    name: "Front Range Homes",
    tagline: "Boutique listings, Colorado",
    accent: "#fca5a5",
    listings: [
      {
        id: "f1",
        title: "Capitol Hill Duplex",
        priceLabel: "$850,000",
        meta: "4 bd · 2 ba · 2,600 sqft",
        city: "Denver, CO",
        imageUrl: null,
      },
      {
        id: "f2",
        title: "Bright East Austin Rental",
        priceLabel: "$2,100/mo",
        meta: "2 bd · 1 ba · 980 sqft",
        city: "Austin, TX",
        imageUrl: null,
      },
      {
        id: "f3",
        title: "Modern Hillside Retreat",
        priceLabel: "$1,240,000",
        meta: "5 bd · 4 ba · 3,400 sqft",
        city: "Boulder, CO",
        imageUrl: null,
      },
    ],
  },
  {
    id: "harbor-co",
    name: "Harbor & Co.",
    tagline: "Waterfront & luxury",
    accent: "#fcd34d",
    listings: [
      {
        id: "h1",
        title: "Wake Up Above the Water",
        priceLabel: "$3,950,000",
        meta: "5 bd · 6 ba · 6,100 sqft",
        city: "Sausalito, CA",
        imageUrl: null,
      },
      {
        id: "h2",
        title: "Glass House on the Bluff",
        priceLabel: "$2,780,000",
        meta: "4 bd · 4 ba · 4,200 sqft",
        city: "Malibu, CA",
        imageUrl: null,
      },
      {
        id: "h3",
        title: "Tucked Into the Pines",
        priceLabel: "$1,690,000",
        meta: "4 bd · 3 ba · 3,050 sqft",
        city: "Carmel, CA",
        imageUrl: null,
        closed: true,
      },
    ],
  },
];
