import Header from "@/components/layout/Header";
import { Suspense } from "react";
import ClientSearchPage from "./ClientSearchPage";

export const metadata = {
  title: "Search Events | Local Event Aggregator & Discovery",
  description: "Search for events happening in your area",
};

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-16">
        {/* Search Page Content */}
        <div className="bg-primary-700 py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 animate-fade-in">
              Search Events
            </h1>

            <Suspense fallback={<SearchFormSkeleton />}>
              <ClientSearchPage />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}

function SearchFormSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-1 md:col-span-3 lg:col-span-2">
          <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-12 bg-gray-300 rounded w-full"></div>
        </div>

        <div>
          <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-12 bg-gray-300 rounded w-full"></div>
        </div>

        <div>
          <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-12 bg-gray-300 rounded w-full"></div>
        </div>

        <div>
          <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-12 bg-gray-300 rounded w-full"></div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="h-12 bg-gray-300 rounded w-32"></div>
      </div>
    </div>
  );
}
