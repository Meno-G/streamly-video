import { Logo } from "@/components/logo";
import { NotFoundView } from "@/components/not-found-view";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>
      <NotFoundView />
    </div>
  );
}
