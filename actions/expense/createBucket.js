import { addDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";

import { db } from "@/lib/config/firebase";

export const createExpenseBucketAction = async ({ userId, title }) => {
  try {
    if (!userId || !title?.trim()) {
      return { success: false, error: "Bucket title is required" };
    }

    const bucketTitle = title.trim();
    const titleLower = bucketTitle.toLowerCase();

    const existingQ = query(
      collection(db, "users", userId, "expenseBuckets"),
      where("titleLower", "==", titleLower),
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0];
      return { success: true, data: { id: existing.id, ...existing.data() } };
    }

    const payload = {
      title: bucketTitle,
      titleLower,
      createdAt: Timestamp.now(),
    };
    const ref = await addDoc(collection(db, "users", userId, "expenseBuckets"), payload);

    return { success: true, data: { id: ref.id, ...payload } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
