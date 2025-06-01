import ClientLayout from "@/components/layout/ClientLayout";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventFinder",
  description: "Discover local events happening in your area",
  keywords: ["events", "local", "discover", "community", "activities"],
  icons: {
    icon: [{ url: "/icons/calendar-favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/calendar-logo.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="/icons/calendar-favicon.svg"
          type="image/svg+xml"
        />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
