import AppHeader from "./AppHeader";
import { getCurrentUser } from "@/lib/currentUser";

export default async function Header() {
  const user = await getCurrentUser();
  return <AppHeader user={user} />;
}
