export interface Root {
  meta: Meta;
  data: Daum[];
  dictionaries: Dictionaries;
}

export interface Meta {
  count: number;
  links: Links;
}

export interface Links {
  self: string;
}

export interface Daum {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  lastTicketingDateTime: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
  pricingOptions: PricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface Aircraft {
  code: string;
}

export interface Operating {
  carrierCode: string;
}

export interface Price {
  currency: string;
  total: string;
  base: string;
  fees: Fee[];
  grandTotal: string;
  additionalServices: AdditionalService[];
}

export interface Fee {
  amount: string;
  type: string;
}

export interface AdditionalService {
  amount: string;
  type: string;
}

export interface PricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

export interface TravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: Price2;
  fareDetailsBySegment: FareDetailsBySegment[];
}

export interface Price2 {
  currency: string;
  total: string;
  base: string;
}

export interface FareDetailsBySegment {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  brandedFare: string;
  brandedFareLabel: string;
  class: string;
  includedCheckedBags: IncludedCheckedBags;
  amenities: Amenity[];
}

export interface IncludedCheckedBags {
  quantity: number;
}

export interface Amenity {
  description: string;
  isChargeable: boolean;
  amenityType: string;
  amenityProvider: AmenityProvider;
}

export interface AmenityProvider {
  name: string;
}

export interface Dictionaries {
  locations: string[];
  aircraft: string[];
  currencies: string[];
  carriers: string[];
}

export interface MyPrice {
  price: string;
  currency: string;
}

export interface Flight {
  price: MyPrice;
  segments: Segment[];
  [property: string]: any;
}

export interface Segment {
  arrival: FlightDetail;
  departure: FlightDetail;
  // [property: string]: any;
}

export interface FlightDetail {
  iataCode: string;
  terminal: string;
  at: string;
  // [property: string]: any;
}
