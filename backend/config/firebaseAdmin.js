
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminAuth;

export const verifyFirebaseIdToken = async (idToken) => {
  if (!adminAuth) {
    const required = [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY"
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length) {
      const error = new Error(
        `Firebase Admin is not configured. Missing: ${missing.join(", ")}`
      );
      error.code = "FIREBASE_ADMIN_NOT_CONFIGURED";
      throw error;
    }

    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          })
        });

    adminAuth = getAuth(app);
  }

  return adminAuth.verifyIdToken(idToken, true);
};
