import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../../lib/utils";

const colors = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-amber-500/10 text-amber-600",
  "bg-purple-500/10 text-purple-600",
  "bg-pink-500/10 text-pink-600",
  "bg-cyan-500/10 text-cyan-600",
];

const Avatar = React.forwardRef(({ className, name, size = "md", ...props }, ref) => {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("relative flex shrink-0 overflow-hidden rounded-xl", sizes[size], className)}
      {...props}
    >
      <AvatarPrimitive.Fallback
        className={cn("flex h-full w-full items-center justify-center rounded-xl font-medium", colors[colorIdx])}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = "Avatar";

export { Avatar };
export default Avatar;
