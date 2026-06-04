import { cn, initials } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASS: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
  "2xl": "h-28 w-28 text-3xl",
};

type Props = {
  name: string;
  avatarPath?: string | null;
  size?: Size;
  className?: string;
  ring?: boolean;
};

/**
 * Universal avatar. Renders the user's uploaded image when present; otherwise
 * a gradient circle with their initials. The image is plain <img> (not
 * next/image) because avatars come from /uploads/avatars/ at runtime and
 * resize uniformly — next/image's optimizer overhead is wasted here.
 */
export function Avatar({ name, avatarPath, size = "md", className, ring = false }: Props) {
  const sizeCls = SIZE_CLASS[size];
  const ringCls = ring ? "ring-2 ring-white" : "";

  if (avatarPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarPath}
        alt={name}
        loading="lazy"
        className={cn(
          "shrink-0 rounded-full bg-slate-100 object-cover shadow-soft",
          sizeCls,
          ringCls,
          className,
        )}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-ukm-teal to-ukm-cyan font-bold text-white shadow-soft",
        sizeCls,
        ringCls,
        className,
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}
