"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  runTransaction,
  doc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/config/firebase";


const INITIAL_MESSAGE = {
  id: 1,
  type: "ai",
  content: "Hello, Traveler! ✈️ Where to next? Tell me your dream destination and I'll help you plan the perfect trip.",
  timestamp: new Date().toISOString(),
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

const getAiUsageLimit = (subscription) => (subscription === "pro" ? 3 : 1);

/**
 * useAiChat
 *
 * Encapsulates all chat + Firebase persistence logic for the /ai page.
 * Uses the Gemini-backed /api/ai/gemini-chat route.
 * Saves trips via createTripAction (same as trips/create-trip).
 */
export function useAiChat({ user, profile, setProfile }) {
  const router = useRouter();

  const [messages, setMessages] = useState([{ ...INITIAL_MESSAGE }]);
  const [isTyping, setIsTyping] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [recentChats, setRecentChats] = useState([]);

  // ── Chat session helpers ───────────────────────────────────────────────────

  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
    setMessages([{ ...INITIAL_MESSAGE, id: Date.now() }]);
    setGeneratedTrip(null);
  }, []);

  const loadChat = useCallback((chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages || []);
    setGeneratedTrip(chat.generatedTrip || null);
  }, []);

  // ── Fetch recent chats ─────────────────────────────────────────────────────

  const fetchRecentChats = useCallback(async () => {
    if (!user) return;
    try {
      const chatsRef = collection(db, "users", user.uid, "chats");
      const snapshot = await getDocs(chatsRef);
      const chats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      chats.sort((a, b) => {
        const tA = a.updatedAt?.toMillis?.() ?? 0;
        const tB = b.updatedAt?.toMillis?.() ?? 0;
        return tB - tA;
      });
      setRecentChats(chats.slice(0, 5));
    } catch (err) {
      console.error("Error fetching recent chats:", err);
    }
  }, [user]);

  // ── Rename chat ────────────────────────────────────────────────────────────

  const renameChat = useCallback(
    async (chatId, newTitle) => {
      if (!user || !newTitle.trim()) return;
      try {
        await updateDoc(doc(db, "users", user.uid, "chats", chatId), {
          title: newTitle.trim(),
          updatedAt: serverTimestamp(),
        });
        setRecentChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, title: newTitle.trim() } : c))
        );
        toast.success("Chat renamed");
      } catch {
        toast.error("Failed to rename chat");
      }
    },
    [user]
  );

  // ── Delete chat ────────────────────────────────────────────────────────────

  const deleteChat = useCallback(
    async (chatId) => {
      if (!user) return;
      if (!window.confirm("Are you sure you want to delete this chat?")) return;
      try {
        await deleteDoc(doc(db, "users", user.uid, "chats", chatId));
        setRecentChats((prev) => prev.filter((c) => c.id !== chatId));
        if (currentChatId === chatId) startNewChat();
        toast.success("Chat deleted");
      } catch {
        toast.error("Failed to delete chat");
      }
    },
    [user, currentChatId, startNewChat]
  );

  // ── Parse trip JSON from AI reply ─────────────────────────────────────────

  const parseTripFromReply = (text) => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse trip JSON:", e);
      }
    }
    return null;
  };

  // ── Persist chat to Firestore ─────────────────────────────────────────────

  const persistChat = useCallback(
    async (finalMessages, tripData, userText) => {
      if (!user) return;
      const payload = {
        messages: finalMessages,
        updatedAt: serverTimestamp(),
        ...(tripData ? { generatedTrip: tripData } : {}),
      };

      if (currentChatId) {
        await updateDoc(doc(db, "users", user.uid, "chats", currentChatId), payload);
      } else {
        const title = userText.substring(0, 40) + (userText.length > 40 ? "..." : "");
        const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
          title,
          createdAt: serverTimestamp(),
          ...payload,
        });
        setCurrentChatId(ref.id);
      }
    },
    [user, currentChatId]
  );

  const reserveAiUsage = useCallback(async () => {
    if (!user?.uid) {
      return {
        allowed: false,
        message: "Please sign in to continue.",
      };
    }

    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }

      const userData = userSnap.data() || {};
      const subscription = userData.subscription || "free";
      const limit = getAiUsageLimit(subscription);
      const monthKey = getCurrentMonthKey();

      const storedMonth = userData.aiAssistantUsageMonth || "";
      const storedCount = Number(userData.aiAssistantUsageCount) || 0;
      const currentCount = storedMonth === monthKey ? storedCount : 0;

      if (currentCount >= limit) {
        return {
          allowed: false,
          message:
            subscription === "pro"
              ? "Pro plan allows 3 AI requests per month. Limit reached for this month."
              : "Free plan allows 1 AI request per month. Upgrade to Pro for more.",
          used: currentCount,
          remaining: 0,
          limit,
          monthKey,
          subscription,
        };
      }

      const nextCount = currentCount + 1;
      transaction.update(userRef, {
        aiAssistantUsageMonth: monthKey,
        aiAssistantUsageCount: nextCount,
        aiAssistantLastUsedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        allowed: true,
        used: nextCount,
        remaining: Math.max(limit - nextCount, 0),
        limit,
        monthKey,
        subscription,
      };
    });

    if (result.allowed && typeof setProfile === "function") {
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          aiAssistantUsageMonth: result.monthKey,
          aiAssistantUsageCount: result.used,
        };
      });
    }

    return result;
  }, [setProfile, user]);

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      const usageCheck = await reserveAiUsage();
      if (!usageCheck.allowed) {
        toast.error(usageCheck.message || "Monthly AI usage limit reached.");
        return;
      }

      const userMsg = {
        id: Date.now(),
        type: "user",
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsTyping(true);
      setGeneratedTrip(null);

      try {
        const res = await axios.post("/api/ai/gemini-chat", {
          messages: updatedMessages.slice(-10).map((m) => ({
            role: m.type === "user" ? "user" : "assistant",
            content: m.content,
          })),
          userPreferences: profile?.preferences || [],
        });

        const { reply } = res.data;
        const tripData = parseTripFromReply(reply);

        // Strip raw JSON from the displayed message
        const cleanReply = reply.replace(
          /```json\n[\s\S]*?\n```/,
          "\n\n✨ **I've generated a trip plan for you!** Click **Save Trip** below to add it to your trips."
        );

        const aiMsg = {
          id: Date.now() + 1,
          type: "ai",
          role: "assistant",
          content: cleanReply,
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);

        if (tripData) setGeneratedTrip(tripData);

        await persistChat(finalMessages, tripData, text);
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "ai",
            role: "assistant",
            content:
              "Sorry, I encountered an error. Please try again in a moment. 🙏",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, profile, persistChat, reserveAiUsage]
  );

  // ── Save generated trip ───────────────────────────────────────────────────

  const saveGeneratedTrip = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in to save trips.");
      return;
    }
    if (!generatedTrip) return;

    setIsSaving(true);
    try {
      // generateTravelPlan returns:
      // { destination, duration, travel_type, budget_category, currency,
      //   total_estimated_cost, hotel_options, itinerary, ...,
      //   tripDetails: { title, category, description, source, startDate,
      //                  interests, accommodation, transportation, activities,
      //                  dietaryRestrictions, specialRequests } }
      const td = generatedTrip.tripDetails || {};

      const currency = (generatedTrip.currency || td.currency || "INR").toUpperCase();

      // Parse days from "X days" string at top level
      const daysRaw = generatedTrip.duration || td.duration || "1";
      const days = parseInt(String(daysRaw)) || 1;

      // Budget: prefer budget_breakdown total, else total_estimated_cost stripped of symbols
      const budgetRaw = String(generatedTrip.total_estimated_cost || "0")
        .replace(/[^0-9.]/g, "");
      const budget = parseFloat(budgetRaw) || 0;

      const userSelection = {
        title: td.title || `${days}-Day Trip to ${generatedTrip.destination}` || "AI Generated Trip",
        category: td.category || "City Break",
        description: td.description || "",
        destination: generatedTrip.destination || td.destination || "",
        source: td.source || "",
        budget,
        currency,
        days,
        persons: parseInt(td.travelers || td.persons || 1),
        startDate: td.startDate || new Date().toISOString().split("T")[0],
        interests: td.interests || profile?.preferences || [],
        accommodation: td.accommodation || "",
        transportation: td.transportation || "",
        activities: td.activities || "",
        dietaryRestrictions: td.dietaryRestrictions || "",
        specialRequests: td.specialRequests || "",
      };

      const docId = Date.now().toString();

      await setDoc(doc(db, "users", user.uid, "trips", docId), {
        id: docId,
        userId: user.uid,
        userEmail: user.email,
        userSelection,
        GeneratedPlan: { ...generatedTrip },
        createdAt: new Date(),
        updatedAt: new Date(),
        currency,
      });

      // Increment trip count on user document
      await updateDoc(doc(db, "users", user.uid), {
        tripCount: increment(1),
      });

      toast.success("Trip Saved Successfully! 🎉");
      router.push(`/trips/${docId}`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save trip. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, generatedTrip, router]);


  return {
    messages,
    isTyping,
    generatedTrip,
    isSaving,
    currentChatId,
    recentChats,
    sendMessage,
    saveGeneratedTrip,
    startNewChat,
    loadChat,
    fetchRecentChats,
    renameChat,
    deleteChat,
  };
}
