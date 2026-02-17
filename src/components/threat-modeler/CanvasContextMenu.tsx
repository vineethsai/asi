import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Copy,
  Trash2,
  Edit2,
  Shield,
  Maximize2,
  PlusCircle,
  CheckSquare,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { TrustLevel } from "./types";

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onChangeTrustLevel: (level: TrustLevel) => void;
  onEditSelected: () => void;
  onAddTrustBoundary: () => void;
  onSelectAll: () => void;
  onFitView: () => void;
  onGroupInBoundary: () => void;
  onSendToFront: () => void;
  onSendToBack: () => void;
  onSendForward: () => void;
  onSendBackward: () => void;
  hasSelection: boolean;
  isNode: boolean;
  isEdge: boolean;
}

export default function CanvasContextMenu({
  children,
  onDeleteSelected,
  onDuplicateSelected,
  onChangeTrustLevel,
  onEditSelected,
  onAddTrustBoundary,
  onSelectAll,
  onFitView,
  onGroupInBoundary,
  onSendToFront,
  onSendToBack,
  onSendForward,
  onSendBackward,
  hasSelection,
  isNode,
  isEdge,
}: CanvasContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {hasSelection && isNode && (
          <>
            <ContextMenuItem onClick={onEditSelected} className="text-xs gap-2">
              <Edit2 className="h-3.5 w-3.5" /> Edit Properties
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicateSelected} className="text-xs gap-2">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-xs gap-2">
                <Shield className="h-3.5 w-3.5" /> Trust Level
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => onChangeTrustLevel("trusted")} className="text-xs">
                  Trusted
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onChangeTrustLevel("semi-trusted")}
                  className="text-xs"
                >
                  Semi-Trusted
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onChangeTrustLevel("untrusted")}
                  className="text-xs"
                >
                  Untrusted
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onClick={onGroupInBoundary} className="text-xs gap-2">
              <PlusCircle className="h-3.5 w-3.5" /> Group in Trust Boundary
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-xs gap-2">
                <ArrowUpToLine className="h-3.5 w-3.5" /> Layer Order
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={onSendToFront} className="text-xs gap-2">
                  <ArrowUpToLine className="h-3.5 w-3.5" /> Bring to Front
                </ContextMenuItem>
                <ContextMenuItem onClick={onSendForward} className="text-xs gap-2">
                  <ArrowUp className="h-3.5 w-3.5" /> Bring Forward
                </ContextMenuItem>
                <ContextMenuItem onClick={onSendBackward} className="text-xs gap-2">
                  <ArrowDown className="h-3.5 w-3.5" /> Send Backward
                </ContextMenuItem>
                <ContextMenuItem onClick={onSendToBack} className="text-xs gap-2">
                  <ArrowDownToLine className="h-3.5 w-3.5" /> Send to Back
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        {hasSelection && isEdge && (
          <>
            <ContextMenuItem onClick={onEditSelected} className="text-xs gap-2">
              <Edit2 className="h-3.5 w-3.5" /> Edit Metadata
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {hasSelection && (
          <ContextMenuItem onClick={onDeleteSelected} className="text-xs gap-2 text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </ContextMenuItem>
        )}
        {!hasSelection && (
          <>
            <ContextMenuItem onClick={onAddTrustBoundary} className="text-xs gap-2">
              <Shield className="h-3.5 w-3.5" /> Add Trust Boundary
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={onSelectAll} className="text-xs gap-2">
          <CheckSquare className="h-3.5 w-3.5" /> Select All
        </ContextMenuItem>
        <ContextMenuItem onClick={onFitView} className="text-xs gap-2">
          <Maximize2 className="h-3.5 w-3.5" /> Fit View
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
