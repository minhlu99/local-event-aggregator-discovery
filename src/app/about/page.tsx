import Header from "@/components/layout/Header";
import { Metadata } from "next";
import { FaBuilding, FaCalendarAlt, FaUsers } from "react-icons/fa";

export const metadata: Metadata = {
  title: "About Us | EventFinder",
  description: "Learn more about the EventFinder platform and our mission",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-primary-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Connecting people with local experiences and events they&apos;ll
              love
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                At EventFinder, we believe that memorable experiences are
                waiting just around the corner. Our mission is simple: to help
                people discover and attend local events that match their
                interests, connect communities, and create lasting memories.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We&apos;ve built a platform that brings together events from
                multiple sources, making it easy for you to find exactly what
                you&apos;re looking for, whether it&apos;s a concert, workshop,
                sporting event, or community gathering.
              </p>

              <div className="border-t border-gray-200 my-8"></div>

              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                What We Offer
              </h2>

              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary-100 p-4 rounded-full mb-4">
                    <FaCalendarAlt className="text-primary-600 text-3xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Event Discovery
                  </h3>
                  <p className="text-gray-600">
                    Find events that match your interests with our powerful
                    search and recommendation tools.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary-100 p-4 rounded-full mb-4">
                    <FaUsers className="text-primary-600 text-3xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Community Connection
                  </h3>
                  <p className="text-gray-600">
                    Connect with like-minded people who share your passions and
                    interests.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary-100 p-4 rounded-full mb-4">
                    <FaBuilding className="text-primary-600 text-3xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Local Focus
                  </h3>
                  <p className="text-gray-600">
                    We prioritize events happening in your area, supporting
                    local communities and businesses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
