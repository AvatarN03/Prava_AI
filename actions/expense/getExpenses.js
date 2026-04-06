import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/config/firebase";

export const getExpensesAction = async ({ userId }) => {
  try {
    if (!userId) return { success: false, error: "User is required" };

    const q = query(
      collection(db, "users", userId, "expenses"),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);

    const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, data: expenses };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
