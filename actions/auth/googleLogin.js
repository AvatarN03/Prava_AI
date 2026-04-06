import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { auth, db } from "@/lib/config/firebase";

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

/**
 * Signs in with Google popup.
 * - Returns { success, isNewUser } on success
 * - Creates a Firestore user doc if the account is brand new
 */
export const googleLoginAction = async () => {
  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existing = userSnap.data() || {};
      const patch = {};

      if (!existing.name && user.displayName) {
        patch.name = user.displayName;
      }
      if (!existing.avatarUrl && user.photoURL) {
        patch.avatarUrl = user.photoURL;
      }
      if (!existing.email && user.email) {
        patch.email = user.email;
      }

      if (typeof existing.aiAssistantUsageCount !== "number") {
        patch.aiAssistantUsageCount = 0;
      }
      if (typeof existing.aiAssistantUsageMonth !== "string") {
        patch.aiAssistantUsageMonth = getCurrentMonthKey();
      }
      if (!("aiAssistantLastUsedAt" in existing)) {
        patch.aiAssistantLastUsedAt = null;
      }

      if (Object.keys(patch).length > 0) {
        await updateDoc(userRef, {
          ...patch,
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true, isNewUser: false };
    }

    // New user → create Firestore document
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: user.displayName || "NA",
      avatarUrl: user.photoURL || "",
      preferences: [],
      tripCount: 0,
      subscription: "free",
      aiAssistantUsageCount: 0,
      aiAssistantUsageMonth: getCurrentMonthKey(),
      aiAssistantLastUsedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, isNewUser: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
