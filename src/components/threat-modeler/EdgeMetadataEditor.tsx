import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { DataFlowMetadata } from "./types";

interface EdgeMetadataEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: DataFlowMetadata;
  onSave: (metadata: DataFlowMetadata) => void;
}

export default function EdgeMetadataEditor({
  open,
  onOpenChange,
  metadata,
  onSave,
}: EdgeMetadataEditorProps) {
  const update = (field: keyof DataFlowMetadata, value: string | boolean) => {
    onSave({ ...metadata, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Data Flow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              value={metadata.label}
              onChange={(e) => update("label", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Protocol</Label>
              <Select value={metadata.protocol} onValueChange={(v) => update("protocol", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="gRPC">gRPC</SelectItem>
                  <SelectItem value="WebSocket">WebSocket</SelectItem>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Authentication</Label>
              <Select
                value={metadata.authentication}
                onValueChange={(v) => update("authentication", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="API Key">API Key</SelectItem>
                  <SelectItem value="OAuth2">OAuth2</SelectItem>
                  <SelectItem value="mTLS">mTLS</SelectItem>
                  <SelectItem value="JWT">JWT</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data Classification</Label>
            <Select
              value={metadata.dataClassification}
              onValueChange={(v) => update("dataClassification", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Internal">Internal</SelectItem>
                <SelectItem value="Confidential">Confidential</SelectItem>
                <SelectItem value="Restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Encrypted</Label>
            <Switch checked={metadata.encrypted} onCheckedChange={(v) => update("encrypted", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Contains PII</Label>
            <Switch
              checked={metadata.containsPII}
              onCheckedChange={(v) => update("containsPII", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Bidirectional</Label>
            <Switch
              checked={metadata.bidirectional}
              onCheckedChange={(v) => update("bidirectional", v)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
