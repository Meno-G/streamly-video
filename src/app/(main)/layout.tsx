import { AppShell } from "@/components/layout/app-shell";
import { CurrentUserProvider } from "@/components/current-user";
import { getSubscribedChannels } from "@/server/queries/channels";
import { getUnreadCount } from "@/server/queries/notifications";
import { getCurrentUser } from "@/server/session";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const [subscriptions, unread] = user
    ? await Promise.all([getSubscribedChannels(user.id, 12), getUnreadCount(user.id)])
    : [[], 0];

  return (
    <CurrentUserProvider
      user={
        user
          ? { id: user.id, username: user.username, name: user.name, avatarUrl: user.profile?.avatarUrl ?? null }
          : null
      }
    >
      <AppShell subscriptions={subscriptions} unreadNotifications={unread}>
        {children}
      </AppShell>
    </CurrentUserProvider>
  );
}
