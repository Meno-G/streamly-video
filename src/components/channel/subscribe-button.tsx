"use client";

import { BellRing } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/current-user";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { requireSignIn } from "@/components/video/video-menu";
import { cn } from "@/lib/utils";
import { toggleSubscription } from "@/server/actions/interactions";

export function SubscribeButton({
  channelId,
  channelName,
  initialSubscribed,
  onCountChange,
  className,
}: {
  channelId: string;
  channelName: string;
  initialSubscribed: boolean;
  onCountChange?: (count: number) => void;
  className?: string;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (user?.id === channelId) return null;

  const run = () =>
    startTransition(async () => {
      const next = !subscribed;
      setSubscribed(next);
      const res = await toggleSubscription(channelId);
      if (!res.ok) {
        setSubscribed(!next);
        toast.error(res.error);
        return;
      }
      setSubscribed(res.data.subscribed);
      onCountChange?.(res.data.subscriberCount);
      toast.success(res.data.subscribed ? `Subscribed to ${channelName}` : `Unsubscribed from ${channelName}`);
    });

  const onClick = () => {
    if (!user) return requireSignIn(router, "Sign in to subscribe");
    if (subscribed) setConfirmOpen(true);
    else run();
  };

  return (
    <>
      <Button
        onClick={onClick}
        disabled={pending}
        variant={subscribed ? "secondary" : "default"}
        className={cn("rounded-full px-4", !subscribed && "bg-foreground text-background hover:bg-foreground/85", className)}
      >
        {subscribed ? (
          <>
            <BellRing /> Subscribed
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Unsubscribe from ${channelName}?`}
        description="Their new videos will no longer appear in your Subscriptions feed."
        confirmLabel="Unsubscribe"
        onConfirm={run}
      />
    </>
  );
}
