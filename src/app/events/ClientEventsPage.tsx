"use client";

import { Suspense } from "react";
import EventsFilter from "./EventsFilter";
import EventsGrid from "./EventsGrid";
import EventsSkeleton from "./EventsSkeleton";

export default function ClientEventsPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-8" suppressHydrationWarning>
      <div className="lg:w-1/4" suppressHydrationWarning>
        <EventsFilter />
      </div>
      <div className="lg:w-3/4" suppressHydrationWarning>
        <Suspense fallback={<EventsSkeleton />}>
          <EventsGrid />
        </Suspense>
      </div>
    </div>
  );
}
