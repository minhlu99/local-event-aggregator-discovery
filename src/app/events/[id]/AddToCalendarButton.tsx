"use client";

import { Event } from "@/types";
import {
  createGoogleCalendarUrl,
  getFormattedEventLocation,
} from "@/utils/calendar";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { FaCalendarPlus } from "react-icons/fa";

interface AddToCalendarButtonProps {
  event: Event;
  className?: string;
}

export default function AddToCalendarButton({
  event,
  className = "",
}: AddToCalendarButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleAddToCalendarClick = () => {
    // Create location string from venue data
    const location = getFormattedEventLocation(event.venue);

    // Generate Google Calendar URL
    const calendarUrl = createGoogleCalendarUrl({
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      startTime: event.startTime,
      endDate: event.endDate,
      endTime: event.endTime,
      location,
      timezone: event.timezone,
    });

    // Open Google Calendar in a new tab
    window.open(calendarUrl, "_blank");
  };

  const handleMouseEnter = () => {
    tooltipTimeout.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setShowTooltip(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.button
        onClick={handleAddToCalendarClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 text-primary-600 font-medium py-2 px-4 rounded-lg border border-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
        aria-label="Add to Google Calendar"
      >
        <FaCalendarPlus />
        <span>Add to Calendar</span>
      </motion.button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
          Add to Google Calendar
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}
