/**
 * Data for the scroll-driven cinematic hero. Each brokerage is a "wall/room"
 * revealed as the camera (video) moves; its listings use real photography for
 * the mock state, replaced by published listings once brokerages add their own.
 */

export type ShowroomListing = {
  id: string;
  title: string;
  priceLabel: string;
  meta: string;
  city: string;
  image: string;
  closed?: boolean;
};

export type ShowroomBrokerage = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  listings: ShowroomListing[];
};

const img = (n: number) => `/listings/listing-${String(n).padStart(2, "0")}.jpg`;

export const DEMO_BROKERAGES: ShowroomBrokerage[] = [
  {
    id: "summit-realty",
    name: "Summit Realty Group",
    tagline: "Denver · Boulder · Front Range",
    accent: "#7dd3fc",
    listings: [
      { id: "s1", title: "Charming Bungalow on Pearl St", priceLabel: "$625,000", meta: "3 bd · 2 ba · 1,842 sqft", city: "Boulder, CO", image: img(1) },
      { id: "s2", title: "Downtown Condo, Skyline Views", priceLabel: "$489,000", meta: "2 bd · 2 ba · 1,180 sqft", city: "Denver, CO", image: img(2) },
      { id: "s3", title: "Townhome near Wash Park", priceLabel: "$715,000", meta: "3 bd · 3.5 ba · 2,100 sqft", city: "Denver, CO", image: img(3) },
      { id: "s4", title: "Mountain-View Ranch", priceLabel: "$679,000", meta: "4 bd · 3 ba · 2,250 sqft", city: "Golden, CO", image: img(4), closed: true },
    ],
  },
  {
    id: "front-range",
    name: "Front Range Homes",
    tagline: "Boutique listings, Colorado",
    accent: "#fca5a5",
    listings: [
      { id: "f1", title: "Capitol Hill Duplex", priceLabel: "$850,000", meta: "4 bd · 2 ba · 2,600 sqft", city: "Denver, CO", image: img(5) },
      { id: "f2", title: "Bright East Austin Rental", priceLabel: "$2,100/mo", meta: "2 bd · 1 ba · 980 sqft", city: "Austin, TX", image: img(6) },
      { id: "f3", title: "Modern Hillside Retreat", priceLabel: "$1,240,000", meta: "5 bd · 4 ba · 3,400 sqft", city: "Boulder, CO", image: img(7) },
    ],
  },
  {
    id: "harbor-co",
    name: "Harbor & Co.",
    tagline: "Waterfront & luxury",
    accent: "#fcd34d",
    listings: [
      { id: "h1", title: "Wake Up Above the Water", priceLabel: "$3,950,000", meta: "5 bd · 6 ba · 6,100 sqft", city: "Sausalito, CA", image: img(8) },
      { id: "h2", title: "Glass House on the Bluff", priceLabel: "$2,780,000", meta: "4 bd · 4 ba · 4,200 sqft", city: "Malibu, CA", image: img(9) },
      { id: "h3", title: "Tucked Into the Pines", priceLabel: "$1,690,000", meta: "4 bd · 3 ba · 3,050 sqft", city: "Carmel, CA", image: img(10), closed: true },
    ],
  },
  {
    id: "skyline-partners",
    name: "Skyline Partners",
    tagline: "City living, refined",
    accent: "#c4b5fd",
    listings: [
      { id: "k1", title: "Penthouse with Park Views", priceLabel: "$4,300,000", meta: "3 bd · 3.5 ba · 3,200 sqft", city: "New York, NY", image: img(11) },
      { id: "k2", title: "Loft in the Arts District", priceLabel: "$1,150,000", meta: "2 bd · 2 ba · 1,700 sqft", city: "Los Angeles, CA", image: img(12) },
      { id: "k3", title: "Riverfront Apartment", priceLabel: "$3,200/mo", meta: "2 bd · 2 ba · 1,250 sqft", city: "Chicago, IL", image: img(13) },
    ],
  },
];
