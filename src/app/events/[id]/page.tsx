import Header from "@/components/layout/Header";
import { fetchEventById, mapTicketmasterEventToAppEvent } from "@/utils/api";
import { formatDate, formatTime, getDateRangeDisplay } from "@/utils/date";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaGlobe,
  FaHashtag,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaTag,
  FaTicketAlt,
  FaUsers,
} from "react-icons/fa";
import AddToCalendarButton from "./AddToCalendarButton";
import RecommendedEvents from "./RecommendedEvents";
import SaveEventButton from "./SaveEventButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Define the API error interface
interface ApiError {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // Fetch the event from Ticketmaster API
    const tmEvent = await fetchEventById(id);
    const event = mapTicketmasterEventToAppEvent(tmEvent);

    // Find the best image for OpenGraph
    const bestImage =
      event.images.find((img) => img.ratio === "16_9" && img.width >= 1200) ||
      event.images[0];

    return {
      title: `${event.name} | Local Event Aggregator & Discovery`,
      description: event.description,
      openGraph: {
        title: event.name,
        description: event.description,
        images: bestImage
          ? [
              {
                url: bestImage.url,
                width: bestImage.width,
                height: bestImage.height,
              },
            ]
          : undefined,
      },
    };
  } catch (error) {
    console.error("Error fetching event metadata:", error);
    return {
      title: "Event | Local Event Aggregator & Discovery",
      description: "View event details.",
    };
  }
}

// Helper to find the best image for display
const getBestEventImage = (
  images: Array<{ url: string; width: number; height: number; ratio?: string }>
) => {
  if (!images || images.length === 0) return "/placeholder-event.jpg";

  // Prefer high-res landscape images
  const heroImage = images.find(
    (img) => (img.ratio === "16_9" || img.ratio === "3_2") && img.width >= 1024
  );

  if (heroImage) return heroImage.url;

  // Fallback to any image with 16:9 ratio
  const wideImage = images.find((img) => img.ratio === "16_9");
  if (wideImage) return wideImage.url;

  // Last resort: just use the first image
  return images[0].url;
};

// Error component for API errors
function ErrorDisplay({ error }: { error: ApiError }) {
  const isRateLimited = error?.response?.status === 429;
  const errorMessage = isRateLimited
    ? "We've hit the rate limit with our data provider."
    : "There was an error loading this event.";
  const errorSubMessage = isRateLimited
    ? "Please wait a few minutes and try again."
    : "Please try again later or search for another event.";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-amber-500 mb-4 flex justify-center">
              <FaExclamationTriangle size={48} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              {errorMessage}
            </h1>
            <p className="text-gray-600 mb-8">{errorSubMessage}</p>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
              <Link
                href="/events"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Browse All Events
              </Link>
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
            <div className="mt-8 text-gray-500 text-sm">
              <p>Error code: {error?.response?.status || "Unknown"}</p>
              {isRateLimited && (
                <p className="mt-1">
                  Our service is experiencing high traffic. Please try again in
                  a few minutes.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;

  try {
    // Fetch the event from Ticketmaster API
    const tmEvent = await fetchEventById(id);
    if (!tmEvent) {
      notFound();
    }

    const event = mapTicketmasterEventToAppEvent(tmEvent);

    // Format the status for display
    const getStatusDisplay = () => {
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

      const status = event.status.toLowerCase();
      return (
        statusMap[status] || {
          bg: "bg-gray-500",
          text: "text-white",
          label: event.status,
        }
      );
    };

    const statusInfo = getStatusDisplay();
    const bestImage = getBestEventImage(event.images);

    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pb-16">
          {/* Hero Image */}
          <div className="relative h-72 md:h-96 w-full overflow-hidden">
            <Image
              src={bestImage}
              alt={event.name}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-6 text-white">
              <div className="container mx-auto">
                {event.status && (
                  <span
                    className={`inline-block ${statusInfo.bg} ${statusInfo.text} text-xs px-2 py-1 rounded-md mb-4`}
                  >
                    {statusInfo.label}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {event.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm md:text-base">
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    <span>
                      {event.startDate
                        ? getDateRangeDisplay(event.startDate, event.endDate)
                        : "Date TBD"}
                      {event.timezone && (
                        <span className="ml-1 text-gray-300 text-xs">
                          (Timezone:{" "}
                          {event.timezone
                            .replace("America/", "")
                            .replace("_", " ")}
                          )
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    <span>{event.venue.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaTag className="mr-2" />
                    <span>{event.category.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Content */}
              <div className="lg:w-2/3">
                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <SaveEventButton eventId={event.id} />

                  {/* If event has tickets */}
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      <FaTicketAlt />
                      <span>Get Tickets</span>
                    </a>
                  )}

                  {/* Add to Calendar button */}
                  <AddToCalendarButton event={event} />

                  {/* If event has a website */}
                  {tmEvent._embedded?.attractions?.[0]?.url && (
                    <a
                      href={tmEvent._embedded.attractions[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
                    >
                      <FaGlobe />
                      <span>Official Website</span>
                    </a>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">
                    About This Event
                  </h2>
                  <p className="text-gray-700 mb-6 whitespace-pre-line">
                    {event.description}
                  </p>

                  {/* Attractions/Performers */}
                  {event.attractions && event.attractions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-3 text-gray-900">
                        Performers
                      </h3>
                      <div className="flex items-start">
                        <FaUsers className="text-primary-500 mt-1 mr-3" />
                        <div>
                          <ul className="list-disc list-inside space-y-1">
                            {event.attractions.map((attraction) => (
                              <li key={attraction.id} className="text-gray-700">
                                {attraction.url ? (
                                  <Link
                                    href={attraction.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:underline"
                                  >
                                    {attraction.name}
                                  </Link>
                                ) : (
                                  attraction.name
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      Tags
                    </h3>
                    <div className="flex items-start">
                      <FaHashtag className="text-primary-500 mt-1 mr-3" />
                      <div className="flex flex-wrap gap-2">
                        {[event.genre.name, event.subGenre.name]
                          .filter(Boolean)
                          .filter(
                            (value, index, self) =>
                              self.indexOf(value) === index
                          ) // Remove duplicates
                          .map((tag) => (
                            <Link
                              key={tag}
                              href={`/events?search=${tag}`}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    Date and Time
                  </h3>
                  <div className="flex items-start mb-6">
                    <FaCalendarAlt className="text-primary-500 mt-1 mr-3" />
                    <div>
                      {event.startDate ? (
                        <>
                          <p className="font-medium text-gray-900">
                            {getDateRangeDisplay(
                              event.startDate,
                              event.endDate
                            )}
                          </p>
                          <p className="text-gray-600">
                            {event.startTime
                              ? formatTime(event.startTime)
                              : "Time TBD"}
                            {event.endTime
                              ? ` - ${formatTime(event.endTime)}`
                              : " - Time TBD"}
                          </p>
                          {event.timezone && (
                            <p className="text-gray-500 text-sm">
                              Timezone:{" "}
                              {event.timezone
                                .replace("America/", "")
                                .replace("_", " ")}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-medium text-gray-900">
                          Date and Time TBD
                        </p>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    Location
                  </h3>
                  <div className="flex items-start mb-6">
                    <FaMapMarkerAlt className="text-primary-500 mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {event.venue.name}
                      </p>
                      <p className="text-gray-600">{event.venue.address}</p>
                      <p className="text-gray-600">
                        {event.venue.city}, {event.venue.state}{" "}
                        {event.venue.postalCode}
                      </p>
                      {event.venue.country &&
                        event.venue.country !== "United States Of America" && (
                          <p className="text-gray-600">{event.venue.country}</p>
                        )}
                      {event.venue.location.latitude &&
                        event.venue.location.longitude && (
                          <Link
                            href={`https://maps.google.com/?q=${event.venue.location.latitude},${event.venue.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-sm mt-1 inline-block"
                            aria-label={`View ${event.venue.name} on Google Maps`}
                          >
                            View on map
                          </Link>
                        )}
                    </div>
                  </div>
                </div>

                {/* Similar Events */}
                <RecommendedEvents
                  currentEventId={event.id}
                  category={event.category.name}
                />

                <div className="mt-8 text-center">
                  <Link
                    href="/recommendations"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View personalized recommendations
                    <span className="ml-1">→</span>
                  </Link>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      {event.priceRanges && event.priceRanges.length > 0 ? (
                        <h3 className="text-2xl font-bold">
                          {event.priceRanges[0].min === 0 &&
                          event.priceRanges[0].max === 0 ? (
                            "Free"
                          ) : (
                            <>
                              {event.priceRanges[0].currency || "$"}
                              {event.priceRanges[0].min}
                              {event.priceRanges[0].min !==
                                event.priceRanges[0].max && (
                                <>
                                  {" "}
                                  - {event.priceRanges[0].currency || "$"}
                                  {event.priceRanges[0].max}
                                </>
                              )}
                            </>
                          )}
                        </h3>
                      ) : (
                        <h3 className="text-2xl font-bold text-gray-900">
                          Pricing Information
                        </h3>
                      )}
                      <div className="flex items-center mt-1 text-gray-600">
                        <FaMoneyBill className="mr-1" />
                        <span className="text-sm">
                          {event.priceRanges && event.priceRanges.length > 0 ? (
                            event.priceRanges[0].min === 0 &&
                            event.priceRanges[0].max === 0 ? (
                              "Free admission"
                            ) : (
                              "Paid admission"
                            )
                          ) : event.url ? (
                            <>
                              <span>See </span>
                              <Link
                                href={event.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline"
                              >
                                official website
                              </Link>
                              <span> for pricing details</span>
                            </>
                          ) : (
                            "Price information unavailable"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Date Information */}
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium text-gray-900">
                          {event.startDate
                            ? formatDate(event.startDate)
                            : "Date TBD"}
                        </p>
                      </div>
                    </div>

                    {/* Time Information */}
                    <div className="flex items-center">
                      <FaClock className="text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-medium text-gray-900">
                          {event.startTime
                            ? `${formatTime(event.startTime)}${
                                event.timezone
                                  ? ` (${event.timezone
                                      .replace("America/", "")
                                      .replace("_", " ")})`
                                  : ""
                              }`
                            : "Time TBD"}
                        </p>
                      </div>
                    </div>

                    {/* Sales Information */}
                    {event.sales && event.sales.startDateTime && (
                      <div className="flex items-start">
                        <FaTicketAlt className="text-gray-400 mr-3 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">
                            Ticket Availability
                          </p>
                          <p className="font-medium text-gray-900">
                            {event.sales.startDateTime && (
                              <>
                                On Sale:{" "}
                                {formatDate(
                                  event.sales.startDateTime.split("T")[0]
                                )}
                              </>
                            )}
                          </p>
                          {event.sales.presales &&
                            event.sales.presales.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-900">
                                  Presales:
                                </p>
                                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                  {event.sales.presales.map(
                                    (presale, index) => (
                                      <li
                                        key={index}
                                        className="text-xs text-gray-800"
                                      >
                                        {presale.name}:{" "}
                                        {formatDate(
                                          presale.startDateTime.split("T")[0]
                                        )}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  <SaveEventButton eventId={event.id} />

                  {/* Buy Tickets Button */}
                  {event.url && (
                    <>
                      <div className="mt-6 mb-2 relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-lg blur opacity-75 animate-pulse"></div>
                        <Link
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-lg text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center text-lg"
                        >
                          <FaTicketAlt className="mr-2 animate-bounce" />
                          Get Tickets
                        </Link>
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-2">
                        Purchase tickets from official provider
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error("Error fetching event:", error);

    // Check if it's a 429 rate limit error or another error
    if ((error as ApiError)?.response?.status === 429) {
      return <ErrorDisplay error={error as ApiError} />;
    }

    notFound();
  }
}
