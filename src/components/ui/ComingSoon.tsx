"use client";

import Header from "@/components/layout/Header";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaArrowLeft, FaCalendar } from "react-icons/fa";

interface ComingSoonProps {
  title?: string;
  description?: string;
  featureName?: string;
  backLink?: {
    text: string;
    href: string;
  };
}

export default function ComingSoon({
  title = "Coming Soon",
  description = "We're working hard to bring you this feature. Please check back later!",
  featureName,
  backLink = {
    text: "Back to Home",
    href: "/",
  },
}: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="bg-primary-100 text-primary-600 p-4 rounded-full">
              <FaCalendar className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {featureName && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {featureName}
              </span>
            </div>
          )}
          <p className="text-gray-600 mb-8">{description}</p>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-sm text-gray-500">
                Stay tuned
              </span>
            </div>
          </div>

          <Link
            href={backLink.href}
            className="inline-flex items-center justify-center px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            {backLink.text}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
