import ComingSoon from "@/components/ui/ComingSoon";

export default function MessagesPage() {
  return (
    <ComingSoon
      title="Messaging System Coming Soon"
      description="We're developing a messaging system that will allow you to connect with event organizers and other attendees. Check back soon!"
      featureName="Messages"
      backLink={{
        text: "Return to Home",
        href: "/",
      }}
    />
  );
}
