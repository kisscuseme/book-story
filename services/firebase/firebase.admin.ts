import * as admin from "firebase-admin";

// firebase admin config 값
const firebaseAdminConfig = !admin.apps.length
  ? {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: (
        process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY as string
      ).replaceAll("\\n", "\n"),
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
    }
  : {};

// Initialize Firebase Admin
const firebaseAdminApp = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    })
  : admin.app();

export { admin, firebaseAdminApp };
