"use client";

import { Event } from "@/types";
import {
  createEvent,
  getCategoryGenres,
  getEventCategories,
} from "@/utils/events";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface CategoryWithGenres {
  segment: {
    id: string;
    name: string;
  };
  genres: Array<{
    id: string;
    name: string;
  }>;
}

export default function EventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryWithGenres[]>([]);
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [showCalendarPrompt, setShowCalendarPrompt] = useState<boolean>(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState<Partial<Event>>({
    name: "",
    description: "",
    imageUrl: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    venue: {
      id: "",
      name: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      location: {
        latitude: 0,
        longitude: 0,
      },
    },
    category: {
      id: "",
      name: "",
    },
    genre: {
      id: "",
      name: "",
    },
    priceRanges: [
      {
        type: "standard",
        currency: "USD",
        min: 0,
        max: 0,
      },
    ],
    images: [],
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getEventCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast.error("Failed to load event categories");
      }
    };

    loadCategories();
  }, []);

  const handleCategoryChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedCategoryId = e.target.value;
    const selectedCategory = categories.find(
      (cat) => cat.segment.id === selectedCategoryId
    )?.segment;

    if (selectedCategory) {
      setFormData((prev) => ({
        ...prev,
        category: {
          id: selectedCategory.id,
          name: selectedCategory.name,
        },
        genre: { id: "", name: "" }, // Reset genre when category changes
      }));

      try {
        const genresData = await getCategoryGenres(selectedCategoryId);
        setGenres(genresData);
      } catch (error) {
        console.error("Failed to load genres:", error);
        toast.error("Failed to load genres for this category");
      }
    }
  };

  const handleGenreChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedGenreId = e.target.value;
    const selectedGenre = genres.find((g) => g.id === selectedGenreId);

    if (selectedGenre) {
      setFormData((prev) => ({
        ...prev,
        genre: {
          id: selectedGenre.id,
          name: selectedGenre.name,
        },
      }));
    }
  };

  const handleVenueChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      venue: {
        ...prev.venue!,
        [name]: value,
      },
    }));
  };

  const handlePriceChange = (
    e: ChangeEvent<HTMLInputElement>,
    index: number,
    field: "min" | "max"
  ) => {
    const value = parseFloat(e.target.value) || 0;

    setFormData((prev) => {
      const updatedPriceRanges = [...(prev.priceRanges || [])];
      if (updatedPriceRanges[index]) {
        updatedPriceRanges[index] = {
          ...updatedPriceRanges[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        priceRanges: updatedPriceRanges,
      };
    });
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Generate Google Calendar event URL
   */
  const generateGoogleCalendarUrl = (event: Event) => {
    // Format dates for Google Calendar
    const startDate = event.startDate.replace(/-/g, "");
    const endDate = event.endDate.replace(/-/g, "");

    // Remove colons from time
    const startTime = event.startTime.replace(/:/g, "");
    const endTime = event.endTime.replace(/:/g, "");

    // Combine date and time
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;

    // Create the calendar URL
    const calendarUrl = new URL("https://calendar.google.com/calendar/render");
    calendarUrl.searchParams.append("action", "TEMPLATE");
    calendarUrl.searchParams.append("text", encodeURIComponent(event.name));
    calendarUrl.searchParams.append("dates", `${start}/${end}`);
    calendarUrl.searchParams.append(
      "details",
      encodeURIComponent(event.description)
    );
    calendarUrl.searchParams.append(
      "location",
      encodeURIComponent(
        `${event.venue.name}, ${event.venue.address}, ${event.venue.city}, ${event.venue.state}, ${event.venue.postalCode}`
      )
    );

    return calendarUrl.toString();
  };

  /**
   * Add to Google Calendar
   */
  const addToGoogleCalendar = () => {
    if (!createdEvent) return;

    const calendarUrl = generateGoogleCalendarUrl(createdEvent);
    window.open(calendarUrl, "_blank");
    setShowCalendarPrompt(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure imageUrl is added to images array
      const updatedFormData = {
        ...formData,
        images: formData.imageUrl
          ? [
              { url: formData.imageUrl, width: 800, height: 600 },
              ...(formData.images || []),
            ]
          : formData.images,
      };

      // Create the event
      const newEvent = await createEvent(updatedFormData);
      toast.success("Event created successfully!");

      // Store the created event and show calendar prompt
      setCreatedEvent(newEvent);
      setShowCalendarPrompt(true);
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create event"
      );
    } finally {
      setLoading(false);
    }
  };

  // If calendar prompt is being shown
  if (showCalendarPrompt) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event Created Successfully!
          </h2>
          <p className="text-gray-800 mb-4">
            Would you like to add this event to your Google Calendar?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={addToGoogleCalendar}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Add to Google Calendar
          </button>

          <button
            onClick={() => router.push("/events")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Skip and View Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Create New Event
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2 text-gray-900">
            Event Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Event Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Event Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Event Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              rows={4}
            />
          </div>
        </div>

        {/* Category and Genre */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2 text-gray-900">
            Category and Genre
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category?.id}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.segment.id} value={cat.segment.id}>
                    {cat.segment.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="genre"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Genre
              </label>
              <select
                id="genre"
                name="genre"
                value={formData.genre?.id}
                onChange={handleGenreChange}
                disabled={!formData.category?.id}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 disabled:text-gray-500"
              >
                <option value="">Select Genre</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2 text-gray-900">
            Date and Time
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Venue Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2 text-gray-900">
            Venue Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Venue Name
              </label>
              <input
                type="text"
                id="venueName"
                name="name"
                value={formData.venue?.name}
                onChange={handleVenueChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.venue?.address}
                onChange={handleVenueChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.venue?.city}
                onChange={handleVenueChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.venue?.state}
                onChange={handleVenueChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.venue?.postalCode}
                onChange={handleVenueChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.venue?.country}
                onChange={handleVenueChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Price Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2 text-gray-900">
            Price Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="minPrice"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Minimum Price ($)
              </label>
              <input
                type="number"
                id="minPrice"
                min="0"
                step="0.01"
                value={formData.priceRanges?.[0]?.min || 0}
                onChange={(e) => handlePriceChange(e, 0, "min")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="maxPrice"
                className="block text-sm font-medium text-gray-800 mb-1"
              >
                Maximum Price ($)
              </label>
              <input
                type="number"
                id="maxPrice"
                min="0"
                step="0.01"
                value={formData.priceRanges?.[0]?.max || 0}
                onChange={(e) => handlePriceChange(e, 0, "max")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 ${
              loading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
