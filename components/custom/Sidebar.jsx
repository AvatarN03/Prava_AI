"use client";

import {  useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PanelLeftCloseIcon, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

import ProfileCard from "./ProfileCard";
import Logo from "./Logo";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuth } from "@/context/useAuth";

import { sidebarMenus } from "@/lib/constants";
import { getUserInitials } from "@/lib/utils/nameInitial";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [modal, setModal] = useState(false);
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.displayName || profile?.username || "Anonymous User";
  const displayEmail = profile?.email || user?.email || "No email provided";



  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: -320,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.3,
        duration: 0.3
      }
    })
  };

  return (
    <>
      {/* Mobile Overlay with Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 h-dvh  md:h-screen flex flex-col shadow-2xl"
      >
        {/* Logo Section with Gradient Background */}
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Animated Background Gradient */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"
          />

          <div className="relative flex items-center justify-between">
            <Logo />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <PanelLeftCloseIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Navigation with Staggered Animation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarMenus.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.name}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block"
                >
                  <motion.div
                    whileHover={{ x: 8 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      group relative flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 overflow-hidden
                      ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative flex items-center flex-1">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                      </motion.div>
                      <span className="relative">{item.name}</span>

                      {/* Hover Arrow */}
                      <ChevronRight className={`
                        w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity
                        ${isActive ? 'text-white' : 'text-gray-400'}
                      `} />
                    </div>

                    {/* Shine Effect on Hover */}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Enhanced User Profile Section */}
        <div className="relative p-4 border-t border-gray-200 dark:border-gray-800">
          {/* Subtle Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent dark:from-blue-950/20" />


          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(" relative flex gap-3 items-center p-3 rounded-xl w-full justify-start cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700", profile?.subscription === "pro" ? "ring-2 ring-yellow-400" : "")}
            onClick={() => setModal(true)}
          >
            {/* Avatar with Gradient Ring */}
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-sm opacity-50"
              />
              <Avatar className="relative w-11 h-11 ring-2 ring-white dark:ring-gray-800">
                <AvatarImage
                  src={profile?.avatarUrl}
                  alt={displayName || "Profile"}
                  className={"object-center object-cover"}
                />
                <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {/* Online Status Indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            </div>

            {/* User Info */}
            <div className="text-left flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {displayEmail}
              </p>
            </div>

            {/* Settings Icon */}
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.div>
          </motion.button>

         
        </div>

        {modal && <ProfileCard modal={modal} setModal={setModal} />}
      </motion.div>
    </>
  );
}