import { deleteDoc, doc } from "firebase/firestore";

import { db } from "@/lib/config/firebase";

export const deleteExpenseAction = async ({ userId, expenseId }) => {
  try {
    if (!userId || !expenseId) {
      return { success: false, error: "User and expense are required" };
    }

    await deleteDoc(doc(db, "users", userId, "expenses", expenseId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
