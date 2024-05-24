const admin = require("firebase-admin");
import {HttpsError} from "firebase-functions/v2/https";
import {AuthData} from "firebase-functions/v2/tasks";

admin.initializeApp();

export const auth_user = (token: AuthData | undefined) => {
  if (token == undefined) {
    throw new HttpsError(
      "unauthenticated",
      "Missing Firebase Authentication Token"
    );
  }
};
