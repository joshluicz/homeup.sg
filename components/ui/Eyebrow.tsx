import type { HTMLAttributes, ReactNode } from "react";

type EyebrowProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function Eyebrow({ children, className = "", ...props }: EyebrowProps) {
  return (
    <span className={["eyebrow", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}
