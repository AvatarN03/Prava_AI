"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  PanelLeftClose,
  PanelRightClose,
  Search,
  ClockFading,
} from "lucide-react";
import { motion } from "framer-motion";

import PageSearch from "./PageSearch";
import { Notification } from "./Notification";
import HeaderWeather from "./HeaderWeather";
import { Accessibility } from "./Accessibility";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const pathname = usePathname();
  const [showPageSearch, setShowPageSearch] = useState(false);




  // Keyboard shortcut for Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowPageSearch(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-30 bg-gray-300/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <div className="px-2 md:px-4 py-3 flex items-center justify-between gap-2 md:gap-4">
          {/* Left Section: Sidebar Toggle + Breadcrumb */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Sidebar Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer transition-colors text-gray-700 dark:text-gray-300"
            >
              <motion.div
                animate={{ rotate: isSidebarOpen ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-5 h-5" />
                ) : (
                  <PanelRightClose className="w-5 h-5" />
                )}
              </motion.div>
            </motion.button>

          </div>

          {/* Right Section: Search + Actions */}
          <div className="flex items-center gap-2">
            {/* Page Search Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPageSearch(true)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              title="Search page (Ctrl+F)"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Notifications */}
            <Notification>
              <button
                className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <ClockFading className="w-5 h-5" />
                
              </button>
            </Notification>

            {/* Accessibility  */}
            <Accessibility />

           
            <HeaderWeather />
          </div>
        </div>
      </motion.div>

      {/* Page Search Component (Ctrl+F style) */}
      <PageSearch
        isOpen={showPageSearch}
        onClose={() => setShowPageSearch(false)}
      />
    </>
  );
};

export default Header;