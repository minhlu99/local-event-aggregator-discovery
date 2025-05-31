"use client";

import EventCard from "@/components/events/EventCard";
import Header from "@/components/layout/Header";
import { Event, User, UserPreferences } from "@/types";
import {
  getCategoryName,
  getClientRecommendations,
} from "@/utils/clientRecommendations";
import { fetchRecommendedEvents } from "@/utils/recommendations";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaArrowRight, FaSpinner } from "react-icons/fa";

export default function RecommendationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [recommendationStrategy, setRecommendationStrategy] =
    useState<string>("");

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";

    // Load saved events
    try {
      const saved = JSON.parse(localStorage.getItem("savedEvents") || "[]");
      setSavedEvents(saved);
    } catch (err) {
      console.error("Error loading saved events:", err);
    }

    if (loggedIn) {
      try {
        // Get user data
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }

        // Get user preferences
        const prefsData = localStorage.getItem("userPreferences");
        if (prefsData) {
          setUserPreferences(JSON.parse(prefsData));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Fetch recommendations
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the current user from localStorage
      let currentUser = null;
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          currentUser = JSON.parse(userData);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }

      // Use the new API-based filtering approach
      const recommendationResult = await fetchRecommendedEvents(
        currentUser,
        12
      );

      // If we got recommendations from the API
      if (
        recommendationResult.events &&
        recommendationResult.events.length > 0
      ) {
        setRecommendations(recommendationResult.events);
        setRecommendationStrategy(recommendationResult.strategy);
      } else {
        // Fallback to old method if the API returns no results
        const response = await fetch(`/api/events?date=upcoming&size=50`);

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

        // Fallback to client-side recommendations
        const clientRecommendedEvents = getClientRecommendations(
          data.events,
          12,
          false
        );
        setRecommendations(clientRecommendedEvents);
        setRecommendationStrategy("client");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching recommendations"
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  // Convert category IDs to their display names
  const getCategoryDisplayNames = (categoryIds: string[] = []): string[] => {
    return categoryIds.map((id) => getCategoryName(id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Hero section */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-8 md:px-10 md:py-12 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                For You
              </h1>
              <p className="text-lg md:text-xl mb-6 max-w-3xl text-gray-600">
                Personalized event recommendations based on your interests and
                preferences.
              </p>

              {!user && (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center bg-white text-primary-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Log in for better recommendations
                  <FaArrowRight className="ml-2" />
                </Link>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaSpinner className="animate-spin text-primary-600 text-4xl mb-4" />
              <p className="text-gray-600">Loading recommendations...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchRecommendations}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="max-w-md mx-auto">
                <Image
                  src="/placeholder-event.jpg"
                  alt="No recommendations"
                  width={200}
                  height={200}
                  className="mx-auto mb-6 rounded-lg opacity-70"
                />
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  No recommendations available
                </h2>
                <p className="text-gray-600 mb-6">
                  We couldn&apos;t find any recommendations for you at the
                  moment. Try updating your preferences or explore events
                  directly.
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
                  <Link
                    href="/profile"
                    className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
                  >
                    Update Preferences
                  </Link>
                  <Link
                    href="/events"
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    Browse All Events
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {user && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Recommended for You
                  </h2>
                  <p className="text-gray-600">
                    {recommendationStrategy === "full" && (
                      <>Based on your interests and location preferences</>
                    )}

                    {recommendationStrategy === "location" && (
                      <>
                        Events near{" "}
                        {userPreferences?.locations?.[0] || "your location"}
                      </>
                    )}

                    {recommendationStrategy === "category" && (
                      <>
                        Events matching your interests in{" "}
                        {getCategoryDisplayNames(
                          userPreferences?.categories || []
                        ).join(", ")}
                      </>
                    )}

                    {(recommendationStrategy === "popular" ||
                      recommendationStrategy === "client" ||
                      !recommendationStrategy) && (
                      <>
                        Based on your interests{" "}
                        {userPreferences?.categories &&
                          userPreferences.categories.length > 0 && (
                            <>
                              in{" "}
                              {getCategoryDisplayNames(
                                userPreferences.categories
                              ).join(", ")}
                            </>
                          )}
                        {userPreferences?.locations &&
                          userPreferences.locations.length > 0 && (
                            <> near {userPreferences.locations[0]}</>
                          )}
                      </>
                    )}
                  </p>
                </div>
              )}

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {recommendations.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EventCard
                      event={event}
                      isSaved={savedEvents.includes(event.id)}
                      onSaveToggle={() => handleSaveToggle(event.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>

              <div className="mt-10 flex justify-center">
                <Link
                  href="/events"
                  className="inline-flex items-center bg-primary-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse All Events
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
