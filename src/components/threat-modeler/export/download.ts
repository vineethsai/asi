/** Trigger a browser download for text / blob content. */
export function downloadBlob(content: BlobPart, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** "threat-model-<slug>-<yyyy-mm-dd>.<ext>" */
export function exportFilename(
  modelName: string | undefined,
  ext: string,
  date = new Date(),
): string {
  const slug = (modelName ?? "model")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `threat-model-${slug || "model"}-${date.toISOString().slice(0, 10)}.${ext}`;
}
