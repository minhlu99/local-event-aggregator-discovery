"use client";

import EventCard from "@/components/events/EventCard";
import { Event } from "@/types";
import * as Motion from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useEvents } from "./EventsContext";

const EventsGrid = () => {
  const { filterParams, isFiltering, setIsFiltering } = useEvents();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
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

  const fetchEvents = useCallback(
    async (pageNumber = 0, append = false) => {
      if (pageNumber === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        // Build the query string from filter params
        const queryParams = new URLSearchParams(filterParams.toString());

        // Default to showing only upcoming events if no date filter is specified
        if (!queryParams.has("date") && !queryParams.has("includePast")) {
          queryParams.set("date", "upcoming");
        }

        // Add pagination parameters
        queryParams.set("page", pageNumber.toString());
        queryParams.set("size", "12"); // Number of items per page

        console.log("Fetching events with params:", queryParams.toString());

        // Call our API endpoint with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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

          // Filter out events with status "offsale"
          const filteredEvents = data.events.filter(
            (event: Event) => event.status !== "offsale"
          );

          // Check if we have more pages to load
          const totalPages = data.page?.totalPages || 0;
          setHasMore(pageNumber < totalPages - 1 && filteredEvents.length > 0);

          // Update events state (append or replace)
          if (append) {
            setEvents((prevEvents) => [...prevEvents, ...filteredEvents]);
          } else {
            setEvents(filteredEvents);
          }
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            throw new Error("Request timed out. Please try again.");
          }
          throw fetchError;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error: unknown) {
        console.error("Error fetching events:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while fetching data"
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsFiltering(false);
      }
    },
    [filterParams, setIsFiltering]
  );

  // Initial fetch and when filter params change
  useEffect(() => {
    if (!mounted) return;
    // Reset page when filter params change
    setPage(0);
    setHasMore(true);
    fetchEvents(0, false);
  }, [filterParams, mounted, fetchEvents]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!mounted) return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
        // Load more data when the user scrolls to the bottom
        const nextPage = page + 1;
        setPage(nextPage);
        fetchEvents(nextPage, true);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.5,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [mounted, hasMore, isLoading, isLoadingMore, page, fetchEvents]);

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

  // Show loading indicator when filters are being applied or initial load
  if ((isLoading && page === 0) || isFiltering) {
    return <EventsGridSkeleton />;
  }

  if (error && events.length === 0) {
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

      {/* Loading indicator for more events */}
      {hasMore && (
        <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
          {isLoadingMore ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
              <p className="text-gray-500">Loading more events...</p>
            </div>
          ) : (
            <div className="h-8 opacity-0">Load more</div>
          )}
        </div>
      )}

      {/* End of results message */}
      {!hasMore && events.length > 0 && (
        <div className="w-full py-8 text-center text-gray-500">
          No more events to load
        </div>
      )}
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
