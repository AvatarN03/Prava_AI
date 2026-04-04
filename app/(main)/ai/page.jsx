"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import {
  MessageSquarePlus,
  MessageSquare,
  Clock,
  Edit2,
  Check,
  X,
  Trash2,
  PanelRightOpen,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { TripCard } from "@/components/chat/TripCard";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { ChatInput } from "@/components/chat/ChatInput";

import { useAuth } from "@/context/useAuth";
import { useAiChat } from "@/hooks/useAiChat";

import { SWIPE_THRESHOLD } from "@/lib/constants";

export default function AiPage() {
  const { user, profile, setProfile } = useAuth();

  const {
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
  } = useAiChat({ user, profile, setProfile });

  const scrollRef = useRef(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);


  const touchStartX = useRef(null);
  const touchStartY = useRef(null);


  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatTitle, setEditingChatTitle] = useState("");


  useEffect(() => {
    fetchRecentChats();
  }, [user, currentChatId, fetchRecentChats]);


  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, generatedTrip]);

  // ── Global swipe detection (mobile only) ──────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartX.current === null) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;

      // Ignore predominantly vertical swipes
      if (Math.abs(dy) > Math.abs(dx)) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      if (!mobileSidebarOpen && dx < -SWIPE_THRESHOLD) {
        // Swipe LEFT → open
        setMobileSidebarOpen(true);
      } else if (mobileSidebarOpen && dx > SWIPE_THRESHOLD) {
        // Swipe RIGHT → close
        setMobileSidebarOpen(false);
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [mobileSidebarOpen]
  );


  const startEditingChat = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title);
  };

  const cancelEditingChat = (e) => {
    if (e) e.stopPropagation();
    setEditingChatId(null);
    setEditingChatTitle("");
  };

  const confirmRenameChat = async (e, chatId) => {
    e.stopPropagation();
    if (!editingChatTitle.trim()) {
      cancelEditingChat();
      return;
    }
    await renameChat(chatId, editingChatTitle);
    setEditingChatId(null);
    setEditingChatTitle("");
  };


  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    await deleteChat(chatId);
  };


  const handleLoadChat = (chat) => {
    if (editingChatId !== chat.id) {
      loadChat(chat);
      setMobileSidebarOpen(false); // auto-close on mobile after selecting
    }
  };


  const SidebarContent = () => (
    <>

      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <Button
          onClick={() => {
            startNewChat();
            setMobileSidebarOpen(false);
          }}
          className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none"
          variant="outline"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <div className="px-1 py-2 text-xs font-bold text-gray-500/80 uppercase tracking-wider">
          Recent Chats
        </div>

        {recentChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleLoadChat(chat)}
            className={`w-full text-left p-3 rounded-xl text-sm flex items-start gap-3 transition-all duration-200 group cursor-pointer ${currentChatId === chat.id
                ? "bg-white dark:bg-gray-800 shadow-md border-transparent text-foreground relative"
                : "hover:bg-white/60 dark:hover:bg-gray-800/60 text-muted-foreground hover:text-foreground border border-transparent hover:border-gray-200 dark:hover:border-gray-700 relative"
              }`}
          >
            {/* Icon */}
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 ${currentChatId === chat.id
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/5 group-hover:text-primary transition-colors"
                }`}
            >
              <MessageSquare className="w-4 h-4" />
            </div>

            {/* Title / edit input */}
            <div className="flex-1 overflow-hidden min-w-0 flex flex-col justify-center">
              {editingChatId === chat.id ? (
                <div
                  className="flex items-center gap-2 mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    className="flex-1 bg-background border border-input rounded-md px-2 py-1 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    value={editingChatTitle}
                    onChange={(e) => setEditingChatTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRenameChat(e, chat.id);
                      if (e.key === "Escape") cancelEditingChat(e);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={(e) => confirmRenameChat(e, chat.id)}
                    className="text-green-600 hover:text-green-700 p-1 shrink-0 bg-green-50 rounded-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEditingChat}
                    className="text-red-500 hover:text-red-600 p-1 shrink-0 bg-red-50 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="truncate font-medium text-[13px] pr-6">
                    {chat.title}
                  </div>
                  <div className="text-[11px] opacity-60 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {chat.updatedAt?.toMillis
                      ? new Date(chat.updatedAt.toMillis()).toLocaleDateString()
                      : "Just now"}
                  </div>
                </>
              )}
            </div>

            {/* Hover action buttons */}
            {editingChatId !== chat.id && (
              <div className="absolute right-3 top-2 bottom-2 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white via-white dark:from-gray-900/50 dark:via-gray-900/50 to-transparent pl-4 pr-1">
                <button
                  onClick={(e) => startEditingChat(chat, e)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                  title="Rename"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {recentChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm text-muted-foreground">
              No recent chats to display.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Start a conversation to save it here.
            </p>
          </div>
        )}
      </div>
    </>
  );


  return (
    <div
      className="flex h-[calc(100dvh-80px)] md:h-screen bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans rounded-sm overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* ── Main Chat Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        <p className="text-xs bg-red-500 p-1 capitalize text-center tracking-wider text-gray-200">Ai usage limit: free users get 1 request/month and pro users get 3 requests/month.</p>

        {/* Mobile top bar – shows toggle button */}
        <div className="flex items-center justify-between px-3 pt-2 pb-0 md:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open recent chats"
          >
            <PanelRightOpen className="w-5 h-5" />
          </button>
          <span className="text-xs text-muted-foreground/60 select-none">
            Swipe left for chats
          </span>
        </div>

        {/* Scrollable messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 scrollbar-gradient relative z-10 w-full"
        >
          <div className="max-w-6xl mx-auto space-y-6 w-full">
            {messages.map((m) => (
              <ChatMessage key={m.id} {...m} />
            ))}

            <AnimatePresence>
              {isTyping && <TypingIndicator />}
              {generatedTrip && (
                <TripCard
                  trip={generatedTrip.tripDetails || generatedTrip}
                  onSave={saveGeneratedTrip}
                  isSaving={isSaving}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input bar */}
        <footer className="p-2 md:p-4 bg-gradient-to-t from-indigo-200/80 to-transparent dark:from-gray-900/80 z-20 w-full">
          <div className="w-full md:w-[85%] md:focus-within:w-full max-w-4xl focus-within:max-w-5xl transition-all duration-300 ease-in-out mx-auto drop-shadow-2xl origin-bottom">
            {messages.length <= 2 && (
              <QuickPrompts onSelect={sendMessage} />
            )}
            <ChatInput onSend={sendMessage} disabled={isTyping} />
          </div>
        </footer>
      </div>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <div className="w-full md:w-80 lg:w-96 border-l border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 flex-col h-full hidden md:flex backdrop-blur-md">
        <SidebarContent />
      </div>

      {/* ── Mobile Sidebar Overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Sliding panel */}
            <motion.div
              key="mobile-sidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed top-0 right-0 h-full w-[80vw] max-w-xs z-40 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200/50 dark:border-gray-800/50 shadow-2xl md:hidden"
              // Prevent swipe-left inside sidebar from propagating to backdrop
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                // Still allow swipe-left to close
                const dx =
                  e.changedTouches[0].clientX - (touchStartX.current ?? e.changedTouches[0].clientX);
                if (dx < -SWIPE_THRESHOLD) setMobileSidebarOpen(false);
                e.stopPropagation();
              }}
            >
              {/* Close button row */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Chats
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}