import { Request, onRequest } from "firebase-functions/v2/https";
import { Flight, Root } from "../types/flights";
import { logger } from "firebase-functions";
import { getDatabase, ref, set, get, child, Database } from "firebase/database";
import { FirebaseApp, initializeApp } from "firebase/app";
import firebase_config from "./credentials";
var Amadeus = require("amadeus");
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "europe-west1" });

const get_params = (req: Request, name: string) => req.query[name];
const is_null = (value: any) =>
  value == "" || value == null || value == undefined;

export const helloWorld = onRequest(async (request, response) => {
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
    response.status(400).send("Bad request");
    return;
  }
  const get_doc_name = () =>
    "flights/".concat(
      origin_location + "_" + destination_location + "_" + departure_date
    );

  let app: FirebaseApp | null, db: Database | null;

  try {
    app = initializeApp(firebase_config);
    db = getDatabase(
      app,
      "https://wanderlast-df182-default-rtdb.europe-west1.firebasedatabase.app"
    );
    const flight_cache = await get(child(ref(db), get_doc_name()));

    if (flight_cache.exists()) {
      response.send(flight_cache.val());
      return;
    }
  } catch (error) {
    app = null;
    db = null;
    logger.error(error);
    logger.error("Not using Firestore cache");
  }

  const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
  });

  try {
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
            origin_location + "_" + destination_location + "_" + departure_date
          )
        ),
        final_result
      );
    }
    response.send(final_result);
  } catch (error) {
    logger.error(error);
    response.sendStatus(500);
  }
});
