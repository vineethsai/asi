import { useMemo } from "react";
import { Copy, Download, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { encodeShareLink, SHARE_LINK_MAX_BYTES } from "../document";
import { copyText, shareUrl, useExports } from "../hooks/useExports";
import { useTM } from "../store";

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
}

/**
 * Share link (P3-24): the whole model is compressed into `?m=`; nothing is
 * uploaded. Recipients get a read-only view with "Make a copy".
 */
export default function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const doc = useTM((s) => s.document);
  const exp = useExports();
  const url = useMemo(() => {
    if (!open) return null;
    const encoded = encodeShareLink(doc);
    return encoded ? shareUrl(encoded) : null;
  }, [open, doc]);

  const copy = async () => {
    if (url && (await copyText(url))) toast.success("Share link copied");
    else toast.error("Clipboard is not available. Select the link and copy it.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" aria-hidden /> Share “{doc.name}”
          </DialogTitle>
          <DialogDescription>
            The model travels inside the link itself; nothing is uploaded. Anyone who opens it sees
            a read-only copy and can make their own copy. Statuses and mitigations are included;
            analysis results are recomputed.
          </DialogDescription>
        </DialogHeader>
        {url ? (
          <div className="space-y-2">
            <label htmlFor="tm-share-url" className="text-xs font-medium">
              Link ({Math.ceil(url.length / 1024)} KB)
            </label>
            <Input
              id="tm-share-url"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-xs"
            />
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            This model is too large for a link (over {Math.round(SHARE_LINK_MAX_BYTES / 1024)} KB
            compressed). Share the JSON file instead; it re-imports with everything intact.
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => void exp.copyJson()}>
            <Copy className="mr-1.5 h-4 w-4" aria-hidden /> Copy JSON
          </Button>
          {url ? (
            <Button onClick={() => void copy()}>
              <Copy className="mr-1.5 h-4 w-4" aria-hidden /> Copy link
            </Button>
          ) : (
            <Button onClick={() => void exp.json()}>
              <Download className="mr-1.5 h-4 w-4" aria-hidden /> Download JSON
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
