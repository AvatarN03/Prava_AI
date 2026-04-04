"use client"; // if using App Router in Next.js 13+

import { createContext, useContext, useEffect, useState } from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import Loading from "@/components/custom/Loading";

import { auth, db } from "@/lib/config/firebase";

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     
  const [profile, setProfile] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
    setUser(authUser || null);

    if (authUser) {
      try {
        const docRef = doc(db, "users", authUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const patch = {};

          if (typeof data.aiAssistantUsageCount !== "number") {
            patch.aiAssistantUsageCount = 0;
          }
          if (typeof data.aiAssistantUsageMonth !== "string") {
            patch.aiAssistantUsageMonth = getCurrentMonthKey();
          }
          if (!("aiAssistantLastUsedAt" in data)) {
            patch.aiAssistantLastUsedAt = null;
          }

          if (Object.keys(patch).length > 0) {
            await updateDoc(docRef, patch);
          }

          setProfile({
            ...data,
            ...patch,
          });
        }
        // ✅ If doc doesn't exist yet, DON'T call setProfile(null)
        // The auth page already set it correctly via setProfile()
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setProfile(null);
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, []);

  const logout = () => {
    console.log(user);
    console.log(profile);
    signOut(auth);
    setUser(null);
    setProfile(null);
  };

  // Update profile picture
  const updateProfilePicture = async (avatarUrl) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { avatarUrl });
      
      // Update local profile state
      setProfile((prev) => ({
        ...prev,
        avatarUrl,
      }));

      return { success: true };
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    }
  };

  // Update preferences
  const updatePreferences = async (preferences) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { preferences });
      
      // Update local profile state
      setProfile((prev) => ({
        ...prev,
        preferences,
      }));

      return { success: true };
    } catch (error) {
      console.error("Error updating preferences:", error);
      throw error;
    }
  };


  if (loading) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        setProfile, 
        logout,
        updateProfilePicture,
        updatePreferences,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);