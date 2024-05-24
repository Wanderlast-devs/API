import {CallableRequest, HttpsError, onCall} from "firebase-functions/v2/https";
import {Flight, Root} from "../types/flights";
import {logger} from "firebase-functions";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  Database,
} from "firebase/database";
import {initializeApp} from "firebase/app";
import firebase_config from "./credentials";
const Amadeus = require("amadeus");

const get_params = (req: CallableRequest, name: string) => req.data[name];
const is_null = (value: any) =>
  value == "" || value == null || value == undefined;

const app = initializeApp(firebase_config);

export const get_flights = onCall(
  {timeoutSeconds: 1200, region: ["europe-west1"], cors: true},
  async (request: CallableRequest) => {
    const origin_location = get_params(request, "origin");
    const destination_location = get_params(request, "destination");
    const departure_date = get_params(request, "departure");
    const adults_num = get_params(request, "adults");
    const children_num = get_params(request, "children") || 0;
    const infants_num = get_params(request, "infants") || 0;

    if (
      is_null(origin_location) ||
      is_null(destination_location) ||
      is_null(departure_date) ||
      is_null(adults_num)
    ) {
      throw new HttpsError("invalid-argument", "Missing parameters");
    }
    const get_doc_name = () =>
      "flights/".concat(
        origin_location + "_" + destination_location + "_" + departure_date
      );

    let db: Database | null;

    try {
      db = getDatabase(
        app,
        "https://wanderlast-df182-default-rtdb.europe-west1.firebasedatabase.app"
      );
      const flight_cache = await get(child(ref(db), get_doc_name()));

      if (flight_cache.exists()) {
        return flight_cache.val();
      }
    } catch (error) {
      db = null;
      logger.error(error);
    }

    const amadeus = new Amadeus({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
    });

    try {
      const result_raw: Root =
    await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin_location,
      destinationLocationCode: destination_location,
      departureDate: departure_date,
      adults: adults_num,
      children: children_num,
      infants: infants_num,
      max: 10,
      nonStop: "false",
    });
      const final_result: Flight[] = result_raw.data.map((flight) => {
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
      if (db != null) {
        await set(
          ref(
            db,
            "flights/".concat(
              origin_location +
                "_" +
                destination_location +
                "_" +
                departure_date
            )
          ),
          final_result
        );
      }
      return final_result;
    } catch (error) {
      logger.error(error);
      throw new HttpsError("internal", "Internal server error during request");
    }
  }
);
