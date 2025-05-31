import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Events | Local Event Aggregator & Discovery",
  description: "Browse all local events happening in your area",
};

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
