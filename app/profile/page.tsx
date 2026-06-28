import ProfileCompletionPrompt from "@/components/ProfileCompletionPrompt";
import ProfileClient from "./ProfileClient";

export default function ProfilePage() {
  return (
    <>
      <ProfileClient />
      <ProfileCompletionPrompt />
    </>
  );
}