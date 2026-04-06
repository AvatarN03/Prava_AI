import { addDoc, collection, Timestamp } from "firebase/firestore";

import { db } from "@/lib/config/firebase";

export const addExpenseAction = async ({ userId, expense }) => {
  try {
    if (!userId) return { success: false, error: "User is required" };

    const amount = Number(expense?.amount || 0);
    if (!expense?.title?.trim() || !expense?.bucketTitle?.trim() || amount <= 0) {
      return { success: false, error: "Please provide title, bucket and valid amount" };
    }

    const payload = {
      title: expense.title.trim(),
      bucketTitle: expense.bucketTitle.trim(),
      amount,
      currency: expense.currency || "INR",
      note: expense.note?.trim() || "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const ref = await addDoc(collection(db, "users", userId, "expenses"), payload);
    return { success: true, data: { id: ref.id, ...payload } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
