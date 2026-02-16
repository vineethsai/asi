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
import { Copy, Trash2, Edit2, Shield, Maximize2, PlusCircle, CheckSquare } from "lucide-react";
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
