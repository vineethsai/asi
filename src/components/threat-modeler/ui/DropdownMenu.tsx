/**
 * Radix DropdownMenu styled for the modeler (P0-12): Escape, outside click and
 * focus return come from Radix. Lives here because src/components/ui has no
 * dropdown primitive and is shared/read-only for the modeler.
 */
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;
export const DropdownMenuGroup = DM.Group;
export const DropdownMenuSub = DM.Sub;
export const DropdownMenuRadioGroup = DM.RadioGroup;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DM.Content>,
  ComponentPropsWithoutRef<typeof DM.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DM.Portal>
    <DM.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn(
        "z-50 min-w-[12rem] max-h-[min(70vh,32rem)] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  </DM.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DM.Item>,
  ComponentPropsWithoutRef<typeof DM.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DM.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none",
      "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "[&_svg]:size-3.5 [&_svg]:shrink-0",
      inset && "pl-7",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DM.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DM.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <DM.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none focus:bg-accent data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DM.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </DM.ItemIndicator>
    </span>
    {children}
  </DM.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DM.RadioItem>,
  ComponentPropsWithoutRef<typeof DM.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DM.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-xs outline-none focus:bg-accent data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DM.ItemIndicator>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </DM.ItemIndicator>
    </span>
    {children}
  </DM.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DM.Label>,
  ComponentPropsWithoutRef<typeof DM.Label>
>(({ className, ...props }, ref) => (
  <DM.Label
    ref={ref}
    className={cn(
      "px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DM.Separator>,
  ComponentPropsWithoutRef<typeof DM.Separator>
>(({ className, ...props }, ref) => (
  <DM.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof DM.SubTrigger>,
  ComponentPropsWithoutRef<typeof DM.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DM.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:size-3.5",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DM.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof DM.SubContent>,
  ComponentPropsWithoutRef<typeof DM.SubContent>
>(({ className, ...props }, ref) => (
  <DM.Portal>
    <DM.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
        className,
      )}
      {...props}
    />
  </DM.Portal>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";
