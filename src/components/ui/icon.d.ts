declare module "@/components/ui/icon" {
  import { FC } from "react";
  export interface IconProps {
    name?: string;
    color?: string;
    size?: number;
  }
  export const Icon: FC<IconProps>;
  export default Icon;
}
