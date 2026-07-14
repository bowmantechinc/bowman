import { cn } from "@/lib/utils";

export function MemberAvatar({
  name,
  initials,
  color,
  textColor,
  size = 28,
  className,
}: {
  name?: string;
  initials: string;
  color?: string;
  textColor?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      title={name}
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: color || "#dbeafe",
        color: textColor || "#1d4ed8",
      }}
    >
      {initials}
    </div>
  );
}
