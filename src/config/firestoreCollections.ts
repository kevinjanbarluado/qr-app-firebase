// Firestore collection names
// Your Firestore currently uses a collection named `perlas-ng-silangan-prod`
// We'll store one document per user at: perlas-ng-silangan-prod/{uid}

export const USERS_COLLECTION =
    (import.meta.env.VITE_USERS_COLLECTION as string | undefined) || 'perlas-ng-silangan-prod';
// QR codes are generated in the frontend and cached in localStorage; no Firestore collection needed.

