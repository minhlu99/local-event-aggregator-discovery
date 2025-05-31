"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBars,
  FaCalendar,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
  FaThumbsUp,
  FaTimes,
  FaUser,
} from "react-icons/fa";

interface User {
  name: string;
  email: string;
  avatar: string;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in when component mounts
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setIsProfileMenuOpen(false);
    // Refresh the page to ensure all components reflect the logged-out state
    window.location.href = "/";
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/events", label: "Events" },
    { path: "/recommendations", label: "For You" },
    { path: "/search", label: "Search" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className="bg-white shadow-sm sticky top-0 z-50"
      suppressHydrationWarning
    >
      <style jsx global>{`
        @keyframes colorShift {
          0% {
            color: #3b82f6;
          }
          25% {
            color: #8b5cf6;
          }
          50% {
            color: #ec4899;
          }
          75% {
            color: #f59e0b;
          }
          100% {
            color: #3b82f6;
          }
        }
        .animate-color-shift {
          animation: colorShift 3s ease-in-out infinite;
        }
        @keyframes thumbsUp {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-thumbs-up {
          animation: thumbsUp 2s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
      <div className="container mx-auto px-4 py-3" suppressHydrationWarning>
        <div
          className="flex items-center justify-between"
          suppressHydrationWarning
        >
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="text-primary-600"
              suppressHydrationWarning
            >
              <FaCalendar size={24} />
            </motion.div>
            <span className="font-bold text-xl text-gray-900">EventFinder</span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-8"
            suppressHydrationWarning
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  isActive(link.path) ? "text-primary-600" : "text-gray-700"
                } ${
                  link.path === "/recommendations"
                    ? "flex items-center group"
                    : ""
                }`}
              >
                {link.path === "/recommendations" ? (
                  <>
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="mr-1 text-primary-600"
                      initial={false}
                    >
                      <span
                        className={
                          !isActive(link.path)
                            ? "animate-thumbs-up animate-color-shift"
                            : ""
                        }
                      >
                        <FaThumbsUp
                          className={
                            isActive(link.path)
                              ? "text-primary-600"
                              : "text-primary-500"
                          }
                          size={14}
                        />
                      </span>
                    </motion.div>
                    <span
                      className={
                        isActive(link.path)
                          ? "text-primary-600"
                          : "font-semibold text-primary-600 relative"
                      }
                    >
                      {link.path === "/recommendations" &&
                      !isActive(link.path) ? (
                        <span className="text-primary-600 font-bold animate-color-shift">
                          For You
                        </span>
                      ) : (
                        link.label
                      )}
                    </span>
                  </>
                ) : (
                  link.label
                )}
              </Link>
            ))}

            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="relative">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-primary-600 object-cover"
                      width={24}
                      height={24}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {user.name}
                  </span>
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaUser className="mr-2" /> Profile
                      </Link>
                      <Link
                        href="/create-event"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaPlus className="mr-2" /> Create Event
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                      >
                        <FaSignOutAlt className="mr-2" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t"
            suppressHydrationWarning
          >
            <nav
              className="container mx-auto px-4 py-3 flex flex-col space-y-4"
              suppressHydrationWarning
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isActive(link.path)
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center" suppressHydrationWarning>
                    {link.path === "/" && <FaCalendar className="mr-2" />}
                    {link.path === "/events" && <FaCalendar className="mr-2" />}
                    {link.path === "/recommendations" && (
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="mr-2 text-primary-600"
                      >
                        <span className="animate-thumbs-up animate-color-shift">
                          <FaThumbsUp
                            className={
                              isActive(link.path)
                                ? "text-primary-600"
                                : "text-primary-500"
                            }
                          />
                        </span>
                      </motion.div>
                    )}
                    {link.path === "/search" && <FaSearch className="mr-2" />}
                    {link.label}
                  </div>
                </Link>
              ))}

              {isLoggedIn && user ? (
                <>
                  <Link
                    href="/profile"
                    className="px-4 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center" suppressHydrationWarning>
                      <div className="mr-2 flex-shrink-0">
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          className="w-5 h-5 rounded-full border border-primary-600"
                          width={24}
                          height={24}
                        />
                      </div>
                      Profile
                    </div>
                  </Link>
                  <Link
                    href="/create-event"
                    className="px-4 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center" suppressHydrationWarning>
                      <FaPlus className="mr-2" />
                      Create Event
                    </div>
                  </Link>
                  <Link
                    href="/settings"
                    className="px-4 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center" suppressHydrationWarning>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Settings
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <div className="flex items-center" suppressHydrationWarning>
                      <FaSignOutAlt className="mr-2" />
                      Sign out
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-primary-600 border border-primary-600 rounded-md text-center font-medium hover:bg-primary-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-center font-medium hover:bg-primary-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
