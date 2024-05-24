import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {getDatabase, ref, set, get, child, Database} from "firebase/database";
import {initializeApp} from "firebase/app";
import firebase_config from "./credentials";
import {auth_user} from "./middleware/auth";
import {get_flight_prices} from "./requests/get_flights_price";
const Amadeus = require("amadeus");

const get_params = (req: CallableRequest, name: string) => req.data[name];
const is_null = (value: any) =>
  value == "" || value == null || value == undefined;

const app = initializeApp(firebase_config);

export const get_flights = onCall(
  {
    timeoutSeconds: 1200,
    region: ["europe-west1"],
    cors: true,
  },
  async (request: CallableRequest) => {
    if (process.env.FUNCTIONS_EMULATOR == undefined) {
      auth_user(request.auth);
    } // Auth client

    // Get params from body
    const origin_location = get_params(request, "origin");
    const destination_location = get_params(request, "destination");
    const departure_date = get_params(request, "departure");
    const adults_num = get_params(request, "adults");
    const children_num = get_params(request, "children") || 0;
    const infants_num = get_params(request, "infants") || 0;

    if (
      // Check if some params are null
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
      ); // Generate DB cache name

    let db: Database | null;

    // Init firebase DB
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

    // Init Amadeus
    const amadeus = new Amadeus({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
    });

    // Make request
    try {
      const final_result = await get_flight_prices(
        amadeus,
        origin_location,
        destination_location,
        departure_date,
        adults_num,
        children_num,
        infants_num
      );
      if (db != null) {
        // Save flight to DB for caching purpose
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
