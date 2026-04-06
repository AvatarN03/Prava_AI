import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/config/firebase";

export const getExpenseBucketsAction = async ({ userId }) => {
  try {
    if (!userId) return { success: false, error: "User is required" };

    const q = query(
      collection(db, "users", userId, "expenseBuckets"),
      orderBy("title", "asc"),
    );
    const snap = await getDocs(q);

    const buckets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, data: buckets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
