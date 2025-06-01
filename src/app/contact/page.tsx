import Header from "@/components/layout/Header";
import { Metadata } from "next";
import { FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Contact Us | EventFinder",
  description:
    "Get in touch with the EventFinder team for support or inquiries",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-primary-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Have questions or feedback? We&apos;d love to hear from you!
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Send Us a Message
                  </h2>
                  <form className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                        placeholder="How can we help you?"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                        placeholder="Tell us how we can help you..."
                        required
                      ></textarea>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Get in Touch
                  </h2>
                  <p className="text-gray-600 mb-8">
                    If you have any questions about our platform, need support
                    with your account, or want to provide feedback, please
                    don&apos;t hesitate to contact us. Our team is here to help!
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="bg-primary-100 p-3 rounded-full">
                          <FaEnvelope className="text-primary-600 text-xl" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Email Us
                        </h3>
                        <p className="text-gray-600 mt-1">
                          <a
                            href="mailto:support@eventfinder.com"
                            className="text-primary-600 hover:underline"
                          >
                            support@eventfinder.com
                          </a>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          We&apos;ll respond to your inquiry within 24 hours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="bg-primary-100 p-3 rounded-full">
                          <FaPhone className="text-primary-600 text-xl" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Call Us
                        </h3>
                        <p className="text-gray-600 mt-1">
                          <a
                            href="tel:+18005551234"
                            className="text-primary-600 hover:underline"
                          >
                            +1 (800) 555-1234
                          </a>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Monday - Friday, 9am - 5pm EST
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="bg-primary-100 p-3 rounded-full">
                          <FaMapMarkerAlt className="text-primary-600 text-xl" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Visit Us
                        </h3>
                        <p className="text-gray-600 mt-1">
                          123 Event Street
                          <br />
                          Suite 400
                          <br />
                          San Francisco, CA 94103
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-md p-8 mt-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Frequently Asked Questions
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    How do I create an account?
                  </h3>
                  <p className="text-gray-600 mt-2">
                    You can create an account by clicking the &quot;Sign
                    Up&quot; button in the top right corner of the navigation
                    bar. Fill in your details and you&apos;ll be ready to go!
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    How do I save events to my favorites?
                  </h3>
                  <p className="text-gray-600 mt-2">
                    When you find an event you like, simply click the heart icon
                    on the event card to save it to your favorites. You can view
                    all your favorite events in your profile.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Can I create and list my own events?
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Yes! Once you have an account, you can create and publish
                    your own events. Just navigate to your profile and click
                    &quot;Create Event.&quot;
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    How can I get personalized event recommendations?
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Our system provides personalized recommendations based on
                    your interests and past event interactions. The more you use
                    EventFinder, the more tailored your recommendations will
                    become!
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
