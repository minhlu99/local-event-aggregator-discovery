import EventForm from "@/components/events/EventForm";
import Header from "@/components/layout/Header";

export const metadata = {
  title: "Create Event | Local Event Aggregator & Discovery",
  description: "Create and publish your own event on our platform",
};

export default function CreateEventPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
              Create Event
            </h1>
            <p className="text-gray-800">
              Fill out the form below to create and publish your event
            </p>
          </div>

          <EventForm />
        </div>
      </main>
    </>
  );
}
