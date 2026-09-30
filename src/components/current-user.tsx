"use client";

import { createContext, useContext } from "react";

export type ViewerInfo = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
} | null;

const CurrentUserContext = createContext<ViewerInfo>(null);

export function CurrentUserProvider({ user, children }: { user: ViewerInfo; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

/** The signed-in viewer (or null) for client components. */
export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
