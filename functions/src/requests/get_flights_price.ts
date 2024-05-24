import {Root} from "../../types/flights";

export interface AmadeusType {
    shopping: {
        flightOffersSearch: {
            get: (params: any) => Promise<Root>;
        };
    };
}

export async function get_flight_prices(
  amadeus: AmadeusType,
  origin_location: string,
  destination_location: string,
  departure_date: string,
  adults_num: number,
  children_num: number,
  infants_num: number
) {
  const result_raw: Root = await amadeus.shopping.flightOffersSearch.get({
    originLocationCode: origin_location,
    destinationLocationCode: destination_location,
    departureDate: departure_date,
    adults: adults_num,
    children: children_num,
    infants: infants_num,
    max: 10,
    nonStop: "false",
  });
  return result_raw.data.map((flight) => {
    return {
      price: {
        price: flight.price.total,
        currency: flight.price.currency,
      },
      segments: flight.itineraries
        .map((itinerary) =>
          itinerary.segments.map((segment) => {
            return {
              departure: segment.departure,
              arrival: segment.arrival,
            };
          })
        )
        .flat(),
    };
  });
}
