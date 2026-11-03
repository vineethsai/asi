/**
 * Back-compat shim over the single icon registry in src/lib/icons.ts (P1-04).
 * Existing call sites (`<Icon name={x.icon} color=… size={28} className=… />`) keep working;
 * new code should import `Icon` / `getIcon` from "@/lib/icons" directly.
 */
import type { FC } from "react";
import { getIcon } from "@/lib/icons";

export interface IconProps {
  name?: string;
  color?: string;
  size?: number;
  className?: string;
}

export const Icon: FC<IconProps> = ({ name, color, size = 28, className }) => {
  const Comp = getIcon(name);
  return (
    <span className={className}>
      <Comp color={color} size={size} aria-hidden focusable="false" />
    </span>
  );
};

export default Icon;
