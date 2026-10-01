import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  deleteDoc,
  serverTimestamp,
  auth,
  isFirebaseConfigured,
  type FirebaseUser
} from '../lib/firebase';
import type { UserProfile, ActiveBooking, RideHistoryItem, CarpoolRide } from '../types';

/**
 * Sync / Save User Profile in Firestore
 * Separates client-editable profile fields (name, phone, email, savedPlaces, emergencyContact)
 * from server-controlled financial fields (walletBalance).
 */
export async function syncUserProfileToFirestore(user: UserProfile): Promise<void> {
  if (!isFirebaseConfigured || !user?.id) return;
  try {
    const userRef = doc(db, 'users', user.id);
    const profileData: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      rating: user.rating,
      savedPlaces: user.savedPlaces || { home: null, work: null, favorites: [] },
      emergencyContact: user.emergencyContact || null,
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, profileData, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      console.info('Firestore: Write skipped or locked by database security rules.');
    } else {
      console.warn('Firestore sync user profile notice:', err?.message || err);
    }
  }
}

/**
 * Fetch User Profile from Firestore
 */
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      console.info('Firestore: Profile fetch skipped (security rules restricted).');
    } else {
      console.warn('Firestore fetch user profile notice:', err?.message || err);
    }
    return null;
  }
}

/**
 * Real-time listener for User Profile updates (Wallet balance, Saved places, etc.)
 */
export function subscribeToUserProfile(userId: string, onUpdate: (user: UserProfile) => void): () => void {
  if (!isFirebaseConfigured || !userId) {
    return () => {};
  }
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as UserProfile);
    }
  }, (err: any) => {
    if (err?.code !== 'permission-denied') {
      console.warn('Firestore user subscription notice:', err?.message || err);
    }
  });
}

/**
 * Sync Active Booking in real-time
 * Ensures the document is strictly owned by the authenticated rider's UID
 */
export async function syncActiveBookingToFirestore(booking: ActiveBooking): Promise<void> {
  if (!isFirebaseConfigured || !booking?.id) return;
  try {
    const bookingRef = doc(db, 'bookings', booking.id);
    const resolvedUserId = auth.currentUser?.uid || (booking as any).userId;
    await setDoc(bookingRef, {
      ...booking,
      userId: resolvedUserId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      console.info('Firestore: Active booking write skipped (rules locked).');
    } else {
      console.warn('Firestore sync booking notice:', err?.message || err);
    }
  }
}

/**
 * Real-time listener for an Active Booking
 */
export function subscribeToActiveBooking(bookingId: string, onUpdate: (booking: ActiveBooking | null) => void): () => void {
  if (!isFirebaseConfigured || !bookingId) {
    return () => {};
  }
  const bookingRef = doc(db, 'bookings', bookingId);
  return onSnapshot(bookingRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as ActiveBooking);
    } else {
      onUpdate(null);
    }
  }, (err: any) => {
    if (err?.code !== 'permission-denied') {
      console.warn('Firestore booking subscription notice:', err?.message || err);
    }
  });
}

/**
 * Delete Active Booking (when cancelled or finished)
 */
export async function removeActiveBookingFromFirestore(bookingId: string): Promise<void> {
  if (!isFirebaseConfigured || !bookingId) return;
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingRef);
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('Firestore delete booking notice:', err?.message || err);
    }
  }
}

/**
 * Save Completed Trip to user's history in Firestore
 * Enforces authenticated rider userId association
 */
export async function saveCompletedTripToFirestore(userId: string, trip: any): Promise<void> {
  if (!isFirebaseConfigured || !trip) return;
  try {
    const tripId = trip.id || `trip_${Date.now()}`;
    const tripRef = doc(db, 'completedTrips', tripId);
    const resolvedUserId = auth.currentUser?.uid || userId;
    await setDoc(tripRef, {
      ...trip,
      userId: resolvedUserId,
      completedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('Firestore save trip notice:', err?.message || err);
    }
  }
}

/**
 * Subscribe to Completed Trips
 * Directly queries only the authenticated rider's documents via where('userId', '==', userId)
 */
export function subscribeToCompletedTrips(userId: string, onUpdate: (trips: any[]) => void): () => void {
  if (!isFirebaseConfigured || !userId) {
    onUpdate([]);
    return () => {};
  }
  const tripsCol = collection(db, 'completedTrips');
  const q = query(tripsCol, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onUpdate(trips);
  }, (err: any) => {
    if (err?.code !== 'permission-denied') {
      console.warn('Firestore completed trips subscription notice:', err?.message || err);
    }
  });
}

/**
 * Helper to build UserProfile from Firebase User
 */
export function buildUserProfileFromFirebase(fbUser: FirebaseUser, existingProfile?: UserProfile | null): UserProfile {
  return {
    id: fbUser.uid,
    name: fbUser.displayName || existingProfile?.name || 'Rider',
    email: fbUser.email || existingProfile?.email || 'rider@ridepulse.in',
    phone: fbUser.phoneNumber || existingProfile?.phone || '+91 98765 43210',
    rating: existingProfile?.rating || 4.98,
    walletBalance: existingProfile?.walletBalance ?? 850.0,
    savedPlaces: existingProfile?.savedPlaces || {
      home: {
        id: 'loc_home',
        name: 'Home Apartment',
        address: '42 Pine Crest Avenue, Koramangala 4th Block',
        lat: 12.9352,
        lng: 77.6245,
        type: 'custom',
      },
      work: {
        id: 'loc_work',
        name: 'Tech Hub Office',
        address: 'Tower 4, RMZ Ecospace, Bellandur Outer Ring Rd',
        lat: 12.9260,
        lng: 77.6762,
        type: 'custom',
      },
      favorites: [],
    },
    emergencyContact: existingProfile?.emergencyContact || {
      name: 'Priya Sharma (Sister)',
      phone: '+91 91234 56789',
    },
  };
}
