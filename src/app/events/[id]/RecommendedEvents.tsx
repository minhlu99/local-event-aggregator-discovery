"use client";

import { Event } from "@/types";
import { formatDate } from "@/utils/date";
import * as Motion from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";

interface RecommendedEventsProps {
  currentEventId: string;
  category: string;
}

const RecommendedEvents = ({
  currentEventId,
  category,
}: RecommendedEventsProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { motion } = Motion;

  useEffect(() => {
    const fetchRecommendedEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build query for similar events by category
        const queryParams = new URLSearchParams();
        if (category) {
          queryParams.set("category", category);
        }

        // Call our API endpoint
        const response = await fetch(`/api/events?${queryParams.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch events");
        }

        // Filter out current event and limit to 3 events
        let recommendedEvents = data.events.filter(
          (event: Event) => event.id !== currentEventId
        );

        // Limit to 3 events
        recommendedEvents = recommendedEvents.slice(0, 3);

        setEvents(recommendedEvents);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching recommended events:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        setIsLoading(false);
      }
    };

    fetchRecommendedEvents();
  }, [currentEventId, category]);

  if (isLoading) {
    return <RecommendedEventsSkeleton />;
  }

  if (error) {
    return null; // Don't show error, just hide the component
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Similar Events You Might Like
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((event) => (
          <motion.div
            key={event.id}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Link href={`/events/${event.id}`} className="block group">
              <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                <Image
                  src={event.images?.[0]?.url || "/placeholder-event.jpg"}
                  alt={event.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {event.status === "onsale" && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md">
                    On Sale
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                {event.name}
              </h3>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <FaCalendarAlt className="mr-1" />
                <span>{formatDate(event.startDate)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FaMapMarkerAlt className="mr-1" />
                <span className="truncate">{event.venue.name}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function RecommendedEventsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-video bg-gray-300 rounded-lg mb-3"></div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedEvents;
