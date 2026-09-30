"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { clearHistory } from "@/server/actions/history";

export function ClearHistoryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <ConfirmDialog
      title="Clear all watch history?"
      description="This removes every video from your history. It can’t be undone."
      confirmLabel="Clear history"
      destructive
      pending={pending}
      onConfirm={() =>
        startTransition(async () => {
          const res = await clearHistory();
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Watch history cleared");
            router.refresh();
          }
        })
      }
    >
      <Button variant="outline">
        <Trash2 /> Clear all
      </Button>
    </ConfirmDialog>
  );
}
