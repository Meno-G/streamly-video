export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type ChannelSummary = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  verified: boolean;
};

/** Everything a video card or list row needs. Dates are ISO strings so it can cross to client components. */
export type VideoCardData = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  views: number;
  createdAt: string;
  isShort: boolean;
  visibility: Visibility;
  channel: ChannelSummary;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  hasMore: boolean;
};

export type FeedSort = "latest" | "popular" | "oldest";

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  edited: boolean;
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
  isMine: boolean;
  isByCreator: boolean;
  parentId: string | null;
  author: ChannelSummary;
};

export type NotificationData = {
  id: string;
  type: "NEW_SUBSCRIBER" | "VIDEO_COMMENT" | "COMMENT_REPLY" | "VIDEO_LIKE";
  read: boolean;
  createdAt: string;
  actor: ChannelSummary;
  video: { id: string; title: string; thumbnailUrl: string | null } | null;
  commentExcerpt: string | null;
};

export type PlaylistSummary = {
  id: string;
  name: string;
  description: string;
  visibility: Visibility;
  thumbnailUrl: string | null;
  videoCount: number;
  updatedAt: string;
  firstVideoId: string | null;
  owner: ChannelSummary;
};
