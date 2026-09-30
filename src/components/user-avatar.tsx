import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const COLORS = ["bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-teal-600", "bg-indigo-600", "bg-orange-600"];

export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const color = COLORS[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length];
  return (
    <Avatar className={cn("size-9", className)}>
      {src && <AvatarImage src={src} alt="" className="object-cover" />}
      <AvatarFallback className={cn("font-medium text-white uppercase", color)}>{name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}
