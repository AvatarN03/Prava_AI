import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/lib/config/firebase";

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

/**
 * Signs in an existing user with email + password.
 */
export const emailSignInAction = async ({ email, password }) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Registers a new user with email + password.
 * - Runs a Firestore transaction to atomically claim the username and create the user doc.
 * - Returns { success, profileData } so the caller can update local state.
 */
export const emailRegisterAction = async ({ email, password, name, username, avatarUrl, preferences }) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;
    const cleanUsername = username.toLowerCase().trim();

    const profileData = {
      uid,
      email: result.user.email,
      name,
      username: cleanUsername,
      tripCount: 0,
      subscription: "free",
      aiAssistantUsageCount: 0,
      aiAssistantUsageMonth: getCurrentMonthKey(),
      aiAssistantLastUsedAt: null,
      avatarUrl,
      preferences,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", uid);
      const usernameRef = doc(db, "usernames", cleanUsername);

      const usernameSnap = await transaction.get(usernameRef);
      if (usernameSnap.exists()) throw new Error("Username already taken");

      transaction.set(usernameRef, { uid });
      transaction.set(userRef, profileData);
    });

    return { success: true, profileData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
