import Header from "@/components/layout/Header";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | EventFinder",
  description: "Privacy Policy for EventFinder platform",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-primary-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              How we collect, use, and protect your information
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-6 text-sm text-gray-500">
                Last Updated: June 1, 2023
              </div>

              <div className="prose prose-lg max-w-none text-gray-700">
                <p>
                  At EventFinder, we take your privacy seriously. This Privacy
                  Policy describes how we collect, use, and share information
                  about you when you use our website, mobile application, and
                  other online products and services (collectively, the
                  &quot;Services&quot;).
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  Information We Collect
                </h2>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Information You Provide to Us
                </h3>
                <p>
                  We collect information you provide directly to us when you:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create an account or profile</li>
                  <li>Fill out forms on our platform</li>
                  <li>Search for events</li>
                  <li>Register for events</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Contact us with questions or feedback</li>
                </ul>
                <p>
                  This information may include your name, email address, phone
                  number, location, preferences, and any other information you
                  choose to provide.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Information We Collect Automatically
                </h3>
                <p>
                  When you access or use our Services, we may automatically
                  collect information about you, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Log Information:</strong> We log information about
                    your use of our Services, including your browser type,
                    access times, pages viewed, and your IP address.
                  </li>
                  <li>
                    <strong>Device Information:</strong> We collect information
                    about the device you use to access our Services, including
                    hardware model, operating system, and unique device
                    identifiers.
                  </li>
                  <li>
                    <strong>Location Information:</strong> With your consent, we
                    may collect and process information about your precise
                    location to provide you with location-based services like
                    finding nearby events.
                  </li>
                  <li>
                    <strong>Cookies and Similar Technologies:</strong> We use
                    cookies and similar technologies to collect information
                    about your browsing behavior and preferences.
                  </li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  How We Use Your Information
                </h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide, maintain, and improve our Services</li>
                  <li>Process transactions and send related information</li>
                  <li>
                    Send you technical notices, updates, security alerts, and
                    support messages
                  </li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>
                    Personalize your experience and deliver content and product
                    recommendations
                  </li>
                  <li>
                    Monitor and analyze trends, usage, and activities in
                    connection with our Services
                  </li>
                  <li>
                    Detect, investigate, and prevent fraudulent transactions and
                    other illegal activities
                  </li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  Sharing Your Information
                </h2>
                <p>We may share information about you as follows:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    With third-party vendors, consultants, and service providers
                    who perform services on our behalf
                  </li>
                  <li>With event organizers when you register for an event</li>
                  <li>
                    In response to a request for information if we believe
                    disclosure is in accordance with any applicable law,
                    regulation, or legal process
                  </li>
                  <li>
                    If we believe your actions are inconsistent with our user
                    agreements or policies, or to protect the rights, property,
                    and safety of EventFinder or others
                  </li>
                  <li>
                    In connection with, or during negotiations of, any merger,
                    sale of company assets, financing, or acquisition of all or
                    a portion of our business by another company
                  </li>
                  <li>With your consent or at your direction</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  Your Choices
                </h2>
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Account Information
                </h3>
                <p>
                  You can update, correct, or delete your account information at
                  any time by logging into your account or contacting us. Note
                  that we may retain certain information as required by law or
                  for legitimate business purposes.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Cookies
                </h3>
                <p>
                  Most web browsers are set to accept cookies by default. If you
                  prefer, you can usually choose to set your browser to remove
                  or reject browser cookies. Please note that if you choose to
                  remove or reject cookies, this could affect the availability
                  and functionality of our Services.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                  Promotional Communications
                </h3>
                <p>
                  You can opt out of receiving promotional emails from
                  EventFinder by following the instructions in those emails. If
                  you opt out, we may still send you non-promotional emails,
                  such as those about your account or our ongoing business
                  relations.
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  Data Security
                </h2>
                <p>
                  We take reasonable measures to help protect information about
                  you from loss, theft, misuse, unauthorized access, disclosure,
                  alteration, and destruction. However, no security system is
                  impenetrable, and we cannot guarantee the security of our
                  systems.
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  Children&apos;s Privacy
                </h2>
                <p>
                  Our Services are not directed to children under 13, and we do
                  not knowingly collect personal information from children under
                  13. If we learn we have collected personal information from a
                  child under 13, we will delete this information.
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  Changes to this Privacy Policy
                </h2>
                <p>
                  We may change this Privacy Policy from time to time. If we
                  make changes, we will notify you by revising the date at the
                  top of the policy and, in some cases, we may provide you with
                  additional notice (such as adding a statement to our homepage
                  or sending you a notification).
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">
                  Contact Us
                </h2>
                <p>
                  If you have any questions about this Privacy Policy, please
                  contact us at:
                </p>
                <p className="mt-2">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:privacy@eventfinder.com"
                    className="text-primary-600 hover:underline"
                  >
                    privacy@eventfinder.com
                  </a>
                </p>
                <p>
                  <strong>Address:</strong>
                  <br />
                  EventFinder Privacy Team
                  <br />
                  123 Event Street, Suite 400
                  <br />
                  San Francisco, CA 94103
                </p>

                <div className="mt-12 border-t border-gray-200 pt-6">
                  <p>
                    If you have concerns about our privacy practices, you can
                    also visit our{" "}
                    <Link
                      href="/contact"
                      className="text-primary-600 hover:underline"
                    >
                      Contact Us
                    </Link>{" "}
                    page to get in touch with our team directly.
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
