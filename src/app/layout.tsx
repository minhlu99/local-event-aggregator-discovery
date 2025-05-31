import ClientLayout from "@/components/layout/ClientLayout";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Event Aggregator & Discovery",
  description: "Discover local events happening in your area",
  keywords: ["events", "local", "discover", "community", "activities"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
