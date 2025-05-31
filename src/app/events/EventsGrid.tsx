"use client";

import EventCard from "@/components/events/EventCard";
import { Event } from "@/types";
import * as Motion from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const EventsGrid = () => {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { motion } = Motion;

  // Only render after client-side hydration to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load saved events from localStorage on component mount
  useEffect(() => {
    if (!mounted) return;

    const loadSavedEvents = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("savedEvents") || "[]");
        setSavedEvents(saved);
      } catch (err) {
        console.error("Error loading saved events:", err);
        setSavedEvents([]);
      }
    };

    loadSavedEvents();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build the query string from search params
        const queryParams = new URLSearchParams();

        // Get all parameters from the URL and pass them through
        // This ensures we use the latest API parameter structure
        if (searchParams) {
          searchParams.forEach((value, key) => {
            // Special handling for location -> city mapping
            if (key === "location") {
              queryParams.set("city", value);
            } else {
              queryParams.set(key, value);
            }
          });
        }

        // Default to showing only upcoming events if no date filter is specified
        if (!queryParams.has("date") && !queryParams.has("includePast")) {
          queryParams.set("date", "upcoming");
        }

        console.log("Fetching events with params:", queryParams.toString());

        // Call our API endpoint with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch(
            `/api/events?${queryParams.toString()}`,
            {
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          // Handle non-OK responses
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `Server responded with status: ${response.status}`
            );
          }

          const data = await response.json();

          if (!data || !Array.isArray(data.events)) {
            throw new Error("Invalid response format from API");
          }

          setEvents(data.events);
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            throw new Error("Request timed out. Please try again.");
          }
          throw fetchError;
        } finally {
          clearTimeout(timeoutId);
        }

        setIsLoading(false);
      } catch (error: unknown) {
        console.error("Error fetching events:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while fetching data"
        );
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [searchParams, mounted]);

  // Function to toggle saved/favorited events
  const handleSaveToggle = (eventId: string) => {
    // Get current saved events from localStorage
    const currentSaved = JSON.parse(
      localStorage.getItem("savedEvents") || "[]"
    );

    let updatedSaved;
    if (currentSaved.includes(eventId)) {
      // Remove event from saved events
      updatedSaved = currentSaved.filter((id: string) => id !== eventId);
      toast.success("Event removed from favorites");
    } else {
      // Add event to saved events
      updatedSaved = [...currentSaved, eventId];
      toast.success("Event saved to favorites");
    }

    // Update localStorage
    localStorage.setItem("savedEvents", JSON.stringify(updatedSaved));

    // Update state
    setSavedEvents(updatedSaved);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  // Show skeleton during server-side rendering to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        suppressHydrationWarning
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="card animate-pulse"
            suppressHydrationWarning
          >
            <div
              className="aspect-video bg-gray-300 rounded-t-lg"
              suppressHydrationWarning
            ></div>
            <div className="p-4 space-y-3" suppressHydrationWarning>
              <div
                className="h-4 bg-gray-300 rounded w-1/4"
                suppressHydrationWarning
              ></div>
              <div
                className="h-6 bg-gray-300 rounded w-3/4"
                suppressHydrationWarning
              ></div>
              <div
                className="h-4 bg-gray-300 rounded w-full"
                suppressHydrationWarning
              ></div>
              <div
                className="h-4 bg-gray-300 rounded w-full"
                suppressHydrationWarning
              ></div>
              <div
                className="pt-4 flex justify-between"
                suppressHydrationWarning
              >
                <div
                  className="h-4 bg-gray-300 rounded w-1/3"
                  suppressHydrationWarning
                ></div>
                <div
                  className="h-4 bg-gray-300 rounded w-1/3"
                  suppressHydrationWarning
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return <EventsGridSkeleton />;
  }

  if (error) {
    const isApiKeyError =
      typeof error === "string" &&
      (error.includes("Invalid API key") || error.includes("API key"));

    const isDateFormatError =
      typeof error === "string" &&
      error.includes("Query param with date must be of valid format");

    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">
          Error Loading Events
        </h2>
        <p className="text-gray-700 mb-2">{error}</p>

        {isDateFormatError && (
          <div className="mt-4 mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left max-w-2xl mx-auto">
            <h3 className="font-medium text-yellow-800 mb-2">
              Date Format Issue
            </h3>
            <p className="text-sm text-yellow-700">
              There&apos;s an issue with the date format in the request to
              Ticketmaster API. This is an internal error that has been logged.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Try one of these options:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-yellow-700">
              <li>
                Use the predefined date filters (Today, This Week, etc.) instead
                of custom dates
              </li>
              <li>
                Try different search criteria that don&apos;t rely on dates
              </li>
              <li>Refresh the page and try again</li>
            </ul>
          </div>
        )}

        {isApiKeyError && (
          <div className="mt-4 mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left max-w-2xl mx-auto">
            <h3 className="font-medium text-yellow-800 mb-2">
              API Key Issue Detected
            </h3>
            <p className="text-sm text-yellow-700">
              It looks like there might be an issue with the Ticketmaster API
              key. Please check:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-yellow-700">
              <li>
                Make sure you have a valid API key set in your .env.local file
              </li>
              <li>
                The environment variable should be named
                NEXT_PUBLIC_TICKETMASTER_API_KEY
              </li>
              <li>You may be exceeding the rate limits of the demo key</li>
            </ul>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          No events found
        </h2>
        <p className="text-gray-500">
          Try adjusting your filters or search terms to find events.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {events.length} {events.length === 1 ? "Event" : "Events"} Found
        </h2>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {events.map((event) => (
          <motion.div key={event.id} variants={itemVariants}>
            <EventCard
              event={event}
              isSaved={savedEvents.includes(event.id)}
              onSaveToggle={handleSaveToggle}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

function EventsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="card animate-pulse">
          <div className="aspect-video bg-gray-300 rounded-t-lg"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="pt-4 flex justify-between">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventsGrid;
