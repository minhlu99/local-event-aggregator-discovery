import ComingSoon from "@/components/ui/ComingSoon";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Account Settings Coming Soon"
      description="We're building a comprehensive settings page where you'll be able to customize your experience, manage notifications, and update your profile."
      featureName="Settings"
      backLink={{
        text: "Go to Profile",
        href: "/profile",
      }}
    />
  );
}
