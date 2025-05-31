"use client";

import * as Motion from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaHeart, FaRegHeart } from "react-icons/fa";

interface SaveEventButtonProps {
  eventId: string;
}

const SaveEventButton = ({ eventId }: SaveEventButtonProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const { motion } = Motion;

  // Check if event is already saved when component mounts
  useEffect(() => {
    // Get saved events from localStorage
    const savedEvents = JSON.parse(localStorage.getItem("savedEvents") || "[]");
    const isEventSaved = savedEvents.includes(eventId);
    setIsSaved(isEventSaved);
  }, [eventId]);

  const handleSaveEvent = () => {
    // Get current saved events
    const savedEvents = JSON.parse(localStorage.getItem("savedEvents") || "[]");

    let updatedSavedEvents;

    if (isSaved) {
      // Remove event from saved events
      updatedSavedEvents = savedEvents.filter((id: string) => id !== eventId);
      toast.success("Event removed from favorites");
    } else {
      // Add event to saved events
      updatedSavedEvents = [...savedEvents, eventId];
      toast.success("Event saved to favorites");
    }

    // Update localStorage
    localStorage.setItem("savedEvents", JSON.stringify(updatedSavedEvents));

    // Update state
    setIsSaved(!isSaved);
  };

  return (
    <motion.button
      onClick={handleSaveEvent}
      className={`w-full py-3 rounded-lg flex items-center justify-center font-medium ${
        isSaved
          ? "bg-primary-100 text-primary-700 border border-primary-300"
          : "bg-primary-600 text-white hover:bg-primary-700"
      } transition-colors`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
    >
      {isSaved ? (
        <>
          <FaHeart className="mr-2" />
          Saved to Favorites
        </>
      ) : (
        <>
          <FaRegHeart className="mr-2" />
          Save to Favorites
        </>
      )}
    </motion.button>
  );
};

export default SaveEventButton;
