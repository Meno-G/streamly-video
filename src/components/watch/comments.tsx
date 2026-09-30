"use client";

import { ArrowUpDown, ChevronDown, ChevronUp, Loader2, MessageSquareText, MoreVertical, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCurrentUser } from "@/components/current-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { requireSignIn } from "@/components/video/video-menu";
import { formatCompact, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addComment, deleteComment, loadComments, loadReplies, toggleCommentLike } from "@/server/actions/comments";
import type { CommentData, Paginated } from "@/types";

type Sort = "top" | "newest";

export function CommentsSection({
  videoId,
  initial,
  initialCount,
}: {
  videoId: string;
  initial: Paginated<CommentData>;
  initialCount: number;
}) {
  const [comments, setComments] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [count, setCount] = useState(initialCount);
  const [sort, setSort] = useState<Sort>("top");
  const [loading, startLoading] = useTransition();
  const headingId = useId();

  const reload = (nextSort: Sort) => {
    setSort(nextSort);
    startLoading(async () => {
      const res = await loadComments(videoId, 1, nextSort);
      if (!res.ok) return void toast.error(res.error);
      setComments(res.data.items);
      setPage(1);
      setHasMore(res.data.hasMore);
    });
  };

  const more = () =>
    startLoading(async () => {
      const res = await loadComments(videoId, page + 1, sort);
      if (!res.ok) return void toast.error(res.error);
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...res.data.items.filter((c) => !seen.has(c.id))];
      });
      setPage(res.data.page);
      setHasMore(res.data.hasMore);
    });

  return (
    <section aria-labelledby={headingId} className="mt-6">
      <div className="mb-6 flex items-center gap-6">
        <h2 id={headingId} className="text-xl font-bold">
          {count.toLocaleString("en")} {count === 1 ? "Comment" : "Comments"}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <ArrowUpDown /> Sort by
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => reload("top")} className={cn(sort === "top" && "bg-accent")}>
              Top comments
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => reload("newest")} className={cn(sort === "newest" && "bg-accent")}>
              Newest first
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommentComposer
        videoId={videoId}
        onPosted={(c) => {
          setComments((prev) => [c, ...prev]);
          setCount((n) => n + 1);
        }}
      />

      {comments.length === 0 && !loading ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <MessageSquareText className="size-8 opacity-60" />
          <p>No comments yet. Start the conversation.</p>
        </div>
      ) : (
        <ul className={cn("mt-8 space-y-6 transition-opacity", loading && page === 1 && "opacity-60")}>
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem
                comment={c}
                videoId={videoId}
                onDeleted={() => {
                  setComments((prev) => prev.filter((x) => x.id !== c.id));
                  setCount((n) => Math.max(0, n - 1 - c.replyCount));
                }}
                onReplyCountChange={(delta) => setCount((n) => n + delta)}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={more} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />} Show more comments
          </Button>
        </div>
      )}
    </section>
  );
}

function CommentComposer({
  videoId,
  parentId,
  onPosted,
  onCancel,
  autoFocus,
  placeholder = "Add a comment…",
  compact,
}: {
  videoId: string;
  parentId?: string;
  onPosted: (c: CommentData) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const user = useCurrentUser();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
          <MessageSquareText className="size-4 text-muted-foreground" />
        </div>
        <p className="flex-1 border-b border-border pb-1.5 text-sm text-muted-foreground">
          <Link href={`/login?callbackUrl=/watch/${videoId}`} className="font-medium text-primary hover:underline">
            Sign in
          </Link>{" "}
          to add a comment
        </p>
      </div>
    );
  }

  const submit = () => {
    const content = value.trim();
    if (!content) return;
    startTransition(async () => {
      const res = await addComment({ videoId, content, parentId });
      if (!res.ok) return void toast.error(res.error);
      setValue("");
      setFocused(false);
      onPosted(res.data);
      if (ref.current) ref.current.style.height = "";
      onCancel?.();
    });
  };

  return (
    <div className="flex gap-3">
      <UserAvatar name={user.name} src={user.avatarUrl} className={compact ? "size-6 text-[10px]" : "size-10"} />
      <div className="flex-1">
        <textarea
          ref={ref}
          value={value}
          autoFocus={autoFocus}
          rows={1}
          maxLength={2000}
          placeholder={placeholder}
          aria-label={placeholder}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          className="w-full resize-none overflow-hidden border-b border-border bg-transparent pb-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
        />
        {(focused || value) && (
          <div className="mt-2 flex items-center justify-end gap-2">
            {value.length > 1800 && <span className="mr-auto text-xs text-muted-foreground">{2000 - value.length} left</span>}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setValue("");
                setFocused(false);
                onCancel?.();
              }}
            >
              Cancel
            </Button>
            <Button size="sm" className="rounded-full" disabled={!value.trim() || pending} onClick={submit}>
              {pending && <Loader2 className="animate-spin" />}
              {parentId ? "Reply" : "Comment"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  videoId,
  onDeleted,
  onReplyCountChange,
  isReply,
}: {
  comment: CommentData;
  videoId: string;
  onDeleted: () => void;
  onReplyCountChange?: (delta: number) => void;
  isReply?: boolean;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const [liked, setLiked] = useState(comment.likedByMe);
  const [likes, setLikes] = useState(comment.likeCount);
  const [replying, setReplying] = useState(false);
  const [replies, setReplies] = useState<CommentData[] | null>(null);
  const [replyCount, setReplyCount] = useState(comment.replyCount);
  const [showReplies, setShowReplies] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const like = () => {
    if (!user) return requireSignIn(router, "Sign in to like comments");
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
    startTransition(async () => {
      const res = await toggleCommentLike(comment.id);
      if (!res.ok) {
        setLiked(liked);
        setLikes(likes);
        toast.error(res.error);
        return;
      }
      setLiked(res.data.liked);
      setLikes(res.data.likeCount);
    });
  };

  const toggleReplies = () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next && replies === null) {
      startTransition(async () => {
        const res = await loadReplies(comment.id);
        if (!res.ok) return void toast.error(res.error);
        setReplies(res.data);
      });
    }
  };

  const remove = () =>
    startTransition(async () => {
      const res = await deleteComment(comment.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Comment deleted");
      onDeleted();
    });

  const addReply = (c: CommentData) => {
    setReplies((prev) => [...(prev ?? []), c]);
    setReplyCount((n) => n + 1);
    setShowReplies(true);
    onReplyCountChange?.(1);
  };

  return (
    <div className="group flex gap-3">
      <Link href={`/channel/${comment.author.username}`} className="shrink-0">
        <UserAvatar name={comment.author.name} src={comment.author.avatarUrl} className={isReply ? "size-6 text-[10px]" : "size-10"} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-1.5 text-[13px]">
          <Link
            href={`/channel/${comment.author.username}`}
            className={cn(
              "font-medium",
              comment.isByCreator && "rounded-full bg-muted-foreground/20 px-2 py-0.5"
            )}
          >
            @{comment.author.username}
          </Link>
          <span className="text-muted-foreground" suppressHydrationWarning>
            {timeAgo(comment.createdAt)}
            {comment.edited && " (edited)"}
          </span>
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.content}</p>
        <div className="-ml-2 mt-1 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-2" onClick={like} aria-pressed={liked} aria-label="Like comment">
            <ThumbsUp className={cn("size-4", liked && "fill-foreground")} />
            {likes > 0 && <span className="text-xs tabular-nums text-muted-foreground">{formatCompact(likes)}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-medium"
            onClick={() => (user ? setReplying(true) : requireSignIn(router, "Sign in to reply"))}
          >
            Reply
          </Button>
          {comment.isMine && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="ml-auto rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 md:data-[state=open]:opacity-100" aria-label="Comment actions">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {replying && (
          <div className="mt-2">
            <CommentComposer
              videoId={videoId}
              parentId={comment.parentId ?? comment.id}
              autoFocus
              compact
              placeholder="Add a reply…"
              onPosted={(c) => (isReply ? onReplyCountChange?.(1) : addReply(c))}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {!isReply && replyCount > 0 && (
          <Button variant="ghost" size="sm" className="-ml-2 mt-1 rounded-full text-primary hover:text-primary" onClick={toggleReplies}>
            {showReplies ? <ChevronUp /> : <ChevronDown />}
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </Button>
        )}
        {showReplies && (
          <div className="mt-2 space-y-4">
            {replies === null ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading replies" />
            ) : (
              replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  videoId={videoId}
                  isReply
                  onDeleted={() => {
                    setReplies((prev) => prev?.filter((x) => x.id !== r.id) ?? null);
                    setReplyCount((n) => n - 1);
                    onReplyCountChange?.(-1);
                  }}
                  onReplyCountChange={(delta) => {
                    // reply-to-reply lands in this thread; refresh it
                    setReplyCount((n) => n + delta);
                    onReplyCountChange?.(delta);
                    startTransition(async () => {
                      const res = await loadReplies(comment.id);
                      if (res.ok) setReplies(res.data);
                    });
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete comment?"
        description={
          !isReply && replyCount > 0
            ? "This deletes your comment and its replies. It can’t be undone."
            : "This permanently deletes your comment."
        }
        confirmLabel="Delete"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}
