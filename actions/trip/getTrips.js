import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";

import { db } from "@/lib/config/firebase";
import { normalizeSearchText } from "@/lib/utils";

const getCreatedAtValue = (trip) => {
  const createdAt = trip?.createdAt;
  if (!createdAt) return 0;
  if (typeof createdAt?.toMillis === "function") return createdAt.toMillis();
  return new Date(createdAt).getTime() || 0;
};

export const getTripsAction = async ({
  userId,
  pageSize,
  cursor,
  searchQuery,
}) => {
  try {
    const tripsRef = collection(db, "users", userId, "trips");

    // 🔍 SEARCH MODE
    if (searchQuery?.trim()) {
      const normalizedTerm = normalizeSearchText(searchQuery);
      const rawTerm = searchQuery.trim();

      const [destinationSnap, titleSnap, categorySnap, legacyDestinationSnap] = await Promise.all([
        getDocs(
          query(
            tripsRef,
            where("searchDestination", ">=", normalizedTerm),
            where("searchDestination", "<=", normalizedTerm + "\uf8ff"),
            limit(pageSize)
          )
        ),
        getDocs(
          query(
            tripsRef,
            where("searchTitle", ">=", normalizedTerm),
            where("searchTitle", "<=", normalizedTerm + "\uf8ff"),
            limit(pageSize)
          )
        ),
        getDocs(
          query(
            tripsRef,
            where("searchCategory", ">=", normalizedTerm),
            where("searchCategory", "<=", normalizedTerm + "\uf8ff"),
            limit(pageSize)
          )
        ),
        getDocs(
          query(
            tripsRef,
            where("userSelection.destination", ">=", rawTerm),
            where("userSelection.destination", "<=", rawTerm + "\uf8ff"),
            limit(pageSize)
          )
        ),
      ]);

      const mergedTrips = new Map();
      [destinationSnap, titleSnap, categorySnap, legacyDestinationSnap].forEach((snapshot) => {
        snapshot.docs.forEach((d) => {
          mergedTrips.set(d.id, {
            id: d.id,
            ...d.data(),
          });
        });
      });

      const trips = Array.from(mergedTrips.values())
        .sort((a, b) => getCreatedAtValue(b) - getCreatedAtValue(a))
        .slice(0, pageSize);

      return {
        success: true,
        data: trips,
        lastDoc: null,
      };
    }

    // 📄 PAGINATION MODE
    const constraints = [orderBy("createdAt", "desc"), limit(pageSize)];

    if (cursor) constraints.push(startAfter(cursor));

    const q = query(tripsRef, ...constraints);
    const snapshot = await getDocs(q);

    const trips = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      data: trips,
      lastDoc:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};