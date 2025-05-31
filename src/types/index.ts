export interface Event {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  venue: Venue;
  category: CategoryReference;
  genre: GenreReference;
  subGenre: GenreReference;
  priceRanges?: PriceRange[];
  url: string;
  status: string;
  images: EventImage[];
  timezone?: string;
  sales?: EventSales;
  attractions?: EventAttraction[];
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface PriceRange {
  type?: string;
  currency?: string;
  min: number;
  max: number;
}

export interface EventImage {
  url: string;
  width: number;
  height: number;
  ratio?: string;
}

export interface CategoryReference {
  id: string;
  name: string;
}

export interface GenreReference {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  preferences: UserPreferences;
  savedEvents: string[];
  attendedEvents: string[];
}

export interface UserPreferences {
  categories: string[];
  locations: string[];
  maxPrice: number;
}

export interface EventFilters {
  search?: string;
  category?: string;
  date?: string;
  location?: string;
  price?: "free" | "paid" | "all";
}

export interface RecommendationParams {
  userId: string;
  limit?: number;
  includeUserHistory?: boolean;
}

// Next.js 15 App Router route handler types
export type RouteSegment<T> = {
  params: T;
};

export type IdParam = {
  id: string;
};

export interface EventAttraction {
  id: string;
  name: string;
  url: string;
}

export interface EventSales {
  startDateTime: string;
  endDateTime: string;
  presales?: EventPresale[];
}

export interface EventPresale {
  name: string;
  startDateTime: string;
  endDateTime: string;
}
