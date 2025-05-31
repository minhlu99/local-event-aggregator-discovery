import ComingSoon from "@/components/ui/ComingSoon";

export default function CreateEventPage() {
  return (
    <ComingSoon
      title="Create Event Feature Coming Soon"
      description="Soon you'll be able to create and publish your own events on our platform. Stay tuned for this exciting feature!"
      featureName="Event Creation"
      backLink={{
        text: "Browse Events",
        href: "/events",
      }}
    />
  );
}
