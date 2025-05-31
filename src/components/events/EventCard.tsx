"use client";

import { Event } from "@/types";
import { formatDate, formatTime, isEventUpcoming } from "@/utils/date";
import { isEventFavorite, toggleFavorite } from "@/utils/favorites";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaHeart,
  FaMapMarkerAlt,
  FaRegHeart,
  FaTicketAlt,
  FaUsers,
} from "react-icons/fa";
import FallbackImage from "../ui/FallbackImage";

interface EventCardProps {
  event: Event;
  isSaved?: boolean;
  onSaveToggle?: (eventId: string) => void;
  className?: string;
}

const EventCard = ({
  event,
  isSaved: externalIsSaved = false,
  onSaveToggle,
  className = "",
}: EventCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(externalIsSaved);

  // Check if event is saved when component mounts
  useEffect(() => {
    if (externalIsSaved === undefined) {
      setIsSaved(isEventFavorite(event.id));
    }
  }, [event.id, externalIsSaved]);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If parent component provided onSaveToggle callback, use that
    if (onSaveToggle) {
      onSaveToggle(event.id);
      setIsSaved(!isSaved);
      return;
    }

    // Otherwise, handle it internally
    const { isFavorite } = toggleFavorite(event);
    setIsSaved(isFavorite);
  };

  // Find the best image to display
  const getBestImage = () => {
    // If there's a direct imageUrl, use it
    if (event.imageUrl) return event.imageUrl;

    // If we have images array, try to find the best one
    if (event.images && event.images.length > 0) {
      // First preference: 16:9 ratio with width >= 640
      const wideHighRes = event.images.find(
        (img) => img.ratio === "16_9" && img.width >= 640
      );
      if (wideHighRes) return wideHighRes.url;

      // Second preference: Any 16:9 ratio
      const wideImage = event.images.find((img) => img.ratio === "16_9");
      if (wideImage) return wideImage.url;

      // Third preference: Any 3:2 ratio
      const standardImage = event.images.find((img) => img.ratio === "3_2");
      if (standardImage) return standardImage.url;

      // Fallback to the first image
      return event.images[0].url;
    }

    // No images available
    return "";
  };

  // Format ticket price display
  const getPriceDisplay = () => {
    if (!event.priceRanges || event.priceRanges.length === 0) {
      // Check if the event has a URL, which suggests tickets are available somewhere
      if (event.url) {
        return "See tickets";
      }

      // Check status for better info
      if (event.status && event.status.toLowerCase() === "onsale") {
        return "On sale";
      } else if (event.status && event.status.toLowerCase() === "offsale") {
        return "Off sale";
      }

      return "Check availability";
    }

    const priceRange = event.priceRanges[0];

    // Format currency symbol based on currency code
    let currencySymbol = "$";
    if (priceRange.currency === "EUR") currencySymbol = "€";
    if (priceRange.currency === "GBP") currencySymbol = "£";

    // Special case for free events
    if (priceRange.min === 0 && priceRange.max === 0) {
      return "Free";
    }

    // For a single price point
    else if (priceRange.min === priceRange.max) {
      return `${currencySymbol}${priceRange.min.toFixed(2)}`;
    }

    // For a price range
    else {
      return `${currencySymbol}${priceRange.min.toFixed(
        2
      )} - ${currencySymbol}${priceRange.max.toFixed(2)}`;
    }
  };

  // Validate and format date for display
  const getFormattedDate = () => {
    if (!event.startDate) return "Date TBD";

    // Check if date is valid
    const date = new Date(event.startDate);
    if (isNaN(date.getTime())) return "Date TBD";

    // Format the date
    const formattedDate = formatDate(event.startDate);

    // Add timezone info if available
    if (event.timezone) {
      // Format timezone: America/New_York -> New York
      const formattedTimezone = event.timezone
        .replace("America/", "")
        .replace("_", " ");

      return `${formattedDate} (${formattedTimezone})`;
    }

    return formattedDate;
  };

  // Format time for display
  const getFormattedTime = () => {
    if (!event.startTime) return "";

    // Attempt to format, return empty string if it fails
    try {
      return formatTime(event.startTime);
    } catch {
      return "";
    }
  };

  // Get event status badge
  const getStatusBadge = () => {
    const statusMap: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      cancelled: { bg: "bg-red-500", text: "text-white", label: "Cancelled" },
      postponed: {
        bg: "bg-yellow-500",
        text: "text-white",
        label: "Postponed",
      },
      rescheduled: {
        bg: "bg-blue-500",
        text: "text-white",
        label: "Rescheduled",
      },
      onsale: { bg: "bg-green-500", text: "text-white", label: "On Sale" },
      offsale: { bg: "bg-gray-500", text: "text-white", label: "Off Sale" },
    };

    // Get upcoming status
    let isUpcoming = false;
    if (event.startDate) {
      // Only calculate if we have a valid date
      const date = new Date(event.startDate);
      if (!isNaN(date.getTime())) {
        isUpcoming = isEventUpcoming(event.startDate);
      }
    }

    const status = event.status?.toLowerCase() || "";
    const statusInfo = statusMap[status];

    if (!statusInfo) {
      // Add default badges based on date
      if (isUpcoming) {
        return (
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-md">
            Upcoming
          </div>
        );
      }
      return null;
    }

    return (
      <div
        className={`absolute top-3 left-3 ${statusInfo.bg} ${statusInfo.text} text-xs px-2 py-1 rounded-md`}
        suppressHydrationWarning
      >
        {statusInfo.label}
      </div>
    );
  };

  // Get attractions (performers/teams)
  const getAttractions = () => {
    if (!event.attractions || event.attractions.length === 0) return null;

    return (
      <div className="flex items-center text-gray-500 text-sm mt-2">
        <FaUsers className="mr-2 text-primary-400" />
        <span className="truncate">
          {event.attractions.map((a) => a.name).join(", ")}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      className={`card overflow-hidden flex flex-col h-full rounded-lg shadow-md bg-white hover:shadow-xl transition-shadow ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      suppressHydrationWarning
    >
      <Link href={`/events/${event.id}`} className="flex flex-col h-full">
        <div className="relative" suppressHydrationWarning>
          <div
            className="aspect-video relative overflow-hidden"
            suppressHydrationWarning
          >
            <FallbackImage
              src={getBestImage()}
              alt={event.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500"
              style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
            />
          </div>
          <div className="absolute top-3 right-3 z-10" suppressHydrationWarning>
            <motion.button
              onClick={handleSaveClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-primary-500 focus:outline-none"
              aria-label={
                isSaved ? "Remove from favorites" : "Add to favorites"
              }
            >
              {isSaved ? (
                <FaHeart className="text-primary-500" />
              ) : (
                <FaRegHeart />
              )}
            </motion.button>
          </div>
          {getStatusBadge()}
          <div
            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4"
            suppressHydrationWarning
          >
            <div
              className="text-white font-medium flex items-center"
              suppressHydrationWarning
            >
              <FaTicketAlt className="mr-1" />
              {getPriceDisplay()}
            </div>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-grow" suppressHydrationWarning>
          <div
            className="flex flex-wrap gap-2 items-center text-sm text-gray-500 mb-2"
            suppressHydrationWarning
          >
            {event.category?.name && (
              <span className="bg-primary-100 text-primary-800 rounded-full px-2 py-0.5 text-xs">
                {event.category.name}
              </span>
            )}
            {event.genre?.name && (
              <span className="bg-gray-100 text-gray-800 rounded-full px-2 py-0.5 text-xs">
                {event.genre.name}
              </span>
            )}
            {event.subGenre?.name &&
              event.subGenre.name !== event.genre?.name && (
                <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                  {event.subGenre.name}
                </span>
              )}
          </div>
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900">
            {event.name}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
          <div className="mt-auto space-y-2 text-sm" suppressHydrationWarning>
            <div
              className="flex items-center text-gray-500"
              suppressHydrationWarning
            >
              <FaCalendarAlt className="mr-2 text-primary-400" />
              <span>{getFormattedDate()}</span>
            </div>
            {getFormattedTime() && (
              <div
                className="flex items-center text-gray-500"
                suppressHydrationWarning
              >
                <FaClock className="mr-2 text-primary-400" />
                <span>{getFormattedTime()}</span>
              </div>
            )}
            <div
              className="flex items-center text-gray-500"
              suppressHydrationWarning
            >
              <FaMapMarkerAlt className="mr-2 text-primary-400" />
              <span className="truncate">
                {event.venue?.name || "Location unavailable"}
                {event.venue?.city && `, ${event.venue.city}`}
                {event.venue?.state && `, ${event.venue.state}`}
              </span>
            </div>
            {getAttractions()}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EventCard;
