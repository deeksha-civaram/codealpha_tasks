import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage, validateImage, type Bucket } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface Props {
  bucket: Bucket;
  userId: string;
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  shape?: "square" | "circle";
}

export function ImageUpload({ bucket, userId, value, onChange, label = "Upload image", shape = "square" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const url = await uploadImage(bucket, file, userId);
      onChange(url);
      toast.success("Uploaded.");
    } catch (e) {
      toast.error((e as Error).message || "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const previewClass =
    shape === "circle"
      ? "h-20 w-20 rounded-full object-cover"
      : "h-32 w-full max-w-sm rounded-sm object-cover";

  return (
    <div className="flex items-center gap-4">
      {value ? (
        <img src={value} alt="" className={previewClass} />
      ) : (
        <div className={`${previewClass} flex items-center justify-center bg-muted text-xs text-muted-foreground`}>
          No image
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : label}
        </Button>
        <p className="mt-1 text-[11px] text-muted-foreground">JPEG, PNG, WebP, or GIF · max 5 MB</p>
      </div>
    </div>
  );
}