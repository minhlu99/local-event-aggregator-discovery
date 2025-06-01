"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

interface EventsContextType {
  filterParams: URLSearchParams;
  setFilterParam: (name: string, value: string) => void;
  clearFilters: () => void;
  isFiltering: boolean;
  setIsFiltering: (value: boolean) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/events";
  const searchParams = useSearchParams();
  const [isFiltering, setIsFiltering] = useState(false);

  // Create memoized instance of current search params
  const filterParams = new URLSearchParams(searchParams?.toString() || "");

  // Update a single filter parameter
  const setFilterParam = useCallback(
    (name: string, value: string) => {
      setIsFiltering(true);
      const params = new URLSearchParams(searchParams?.toString() || "");

      // Handle special cases like date filter
      if (name === "date") {
        params.delete("startDateTime");
        params.delete("endDateTime");
        params.delete("includePast");
      }
      // For category filtering
      else if (name === "category") {
        params.delete("classificationName");
        params.delete("classificationId");
        params.delete("segmentId");
        params.delete("category");

        if (value) {
          // Use the category ID directly as the classificationId
          params.set("classificationId", value);
          name = ""; // Don't set the name parameter later
        }
      }
      // For location filtering
      else if (name === "location") {
        if (!value) {
          // If clearing location, also clear related location parameters
          params.delete("location");
          params.delete("latlong");
          params.delete("radius");
          params.delete("unit");
          name = ""; // Don't set the name parameter later
        }
      }
      // If setting latlong directly, ensure other location params exist
      else if (name === "latlong") {
        if (!value) {
          // If clearing coordinates, also clear related location parameters
          params.delete("location");
          params.delete("latlong");
          params.delete("radius");
          params.delete("unit");
          name = ""; // Don't set the name parameter later
        } else if (!params.has("radius")) {
          // Ensure we have a default radius if not already set
          params.set("radius", "25");
        }
        if (!params.has("unit")) {
          // Ensure we have a default unit if not already set
          params.set("unit", "miles");
        }
      }

      // For most parameters, set or delete based on value
      if (name) {
        if (value) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
      }

      // Always set sort to relevance,desc as default
      params.set("sort", "relevance,desc");

      // Use shallow routing to update URL without full page reload
      const newUrl = `${pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      router.push(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setIsFiltering(true);
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <EventsContext.Provider
      value={{
        filterParams,
        setFilterParam,
        clearFilters,
        isFiltering,
        setIsFiltering,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

// Hook to use the events context
export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}
