import type { HTMLAttributes, ReactNode } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function Badge({ children, className = "", ...props }: BadgeProps) {
  return (
    <span className={["badge-savings", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}
