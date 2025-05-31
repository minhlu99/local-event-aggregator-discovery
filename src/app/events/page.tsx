import Header from "@/components/layout/Header";
import { Suspense } from "react";
import ClientEventsPage from "./ClientEventsPage";
import EventsSkeleton from "./EventsSkeleton";
import FilterSkeleton from "./FilterSkeleton";

export const metadata = {
  title: "Events | Local Event Aggregator & Discovery",
  description: "Browse all local events happening in your area",
};

export default function EventsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <div
          className="bg-primary-700 text-white py-12"
          suppressHydrationWarning
        >
          <div className="container mx-auto px-4" suppressHydrationWarning>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
              Explore Events
            </h1>
            <p className="text-xl text-primary-100 animate-fade-in">
              Discover events happening around you
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8" suppressHydrationWarning>
          <Suspense fallback={<PageSkeleton />}>
            <ClientEventsPage />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8" suppressHydrationWarning>
      <div className="lg:w-1/4" suppressHydrationWarning>
        <FilterSkeleton />
      </div>
      <div className="lg:w-3/4" suppressHydrationWarning>
        <EventsSkeleton />
      </div>
    </div>
  );
}
