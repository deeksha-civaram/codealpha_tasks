import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, excerptFrom, readingTime, safeRenderMarkdown, slugify } from "@/lib/blog-utils";
import { aiAssist } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Wand2, Tags, FileText, Eye, EyeOff } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/write")({
  head: () => ({ meta: [{ title: "Write — BlogSphere AI" }] }),
  component: WritePage,
});

const ACTIONS = [
  { key: "improve", label: "Improve writing", icon: Wand2, target: "content" as const },
  { key: "title", label: "Suggest titles", icon: Sparkles, target: "title" as const },
  { key: "outline", label: "Generate outline", icon: FileText, target: "content" as const },
  { key: "summarize", label: "Meta description", icon: FileText, target: "excerpt" as const },
  { key: "tags", label: "Suggest tags", icon: Tags, target: "tags" as const },
] as const;

function WritePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [category, setCategory] = useState<string>("Technology");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<{ action: string; content: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const assist = useServerFn(aiAssist);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const runAi = async (action: typeof ACTIONS[number]) => {
    const source = action.key === "title" ? (content || title) : action.key === "tags" ? (title + "\n" + content) : (action.target === "content" ? content : title + "\n" + content);
    if (!source.trim()) { toast.error("Add some content first."); return; }
    setBusy(action.key);
    setAiOutput(null);
    try {
      const { content: out } = await assist({ data: { action: action.key, text: source.slice(0, 18000) } });
      setAiOutput({ action: action.key, content: out });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  const applyAi = () => {
    if (!aiOutput) return;
    if (aiOutput.action === "improve") setContent(aiOutput.content);
    else if (aiOutput.action === "outline") setContent((c) => (c ? c + "\n\n" : "") + aiOutput.content);
    else if (aiOutput.action === "summarize") setExcerpt(aiOutput.content);
    else if (aiOutput.action === "tags") setTags(aiOutput.content);
    else if (aiOutput.action === "title") {
      const first = aiOutput.content.split("\n").find((l) => l.trim())?.replace(/^\d+\.\s*/, "").replace(/^["']|["']$/g, "");
      if (first) setTitle(first);
    }
    setAiOutput(null);
    toast.success("Applied.");
  };

  const save = async (status: "draft" | "published") => {
    if (!user) return;
    if (!title.trim() || !content.trim()) { toast.error("Title and content are required."); return; }
    setSaving(true);
    try {
      const slug = slugify(title);
      const tagArr = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const { data, error } = await supabase.from("posts").insert({
        author_id: user.id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        excerpt: excerpt.trim() || excerptFrom(content),
        content,
        cover_image: cover.trim() || null,
        category,
        tags: tagArr,
        slug,
        reading_time: readingTime(content),
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      }).select("slug").single();
      if (error) throw error;
      toast.success(status === "published" ? "Published." : "Saved as draft.");
      if (status === "published" && data) nav({ to: "/post/$slug", params: { slug: data.slug } });
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  if (loading || !user) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr,320px]">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">New story</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
              {preview ? <><EyeOff className="h-4 w-4" /> Edit</> : <><Eye className="h-4 w-4" /> Preview</>}
            </Button>
            <Button variant="outline" size="sm" disabled={saving} onClick={() => save("draft")}>Save draft</Button>
            <Button size="sm" disabled={saving} onClick={() => save("published")}>Publish</Button>
          </div>
        </div>

        {preview ? (
          <article className="prose-paper">
            <h1>{title || "Untitled"}</h1>
            {subtitle && <p className="text-xl text-muted-foreground italic">{subtitle}</p>}
            {cover && <img src={cover} alt="" />}
            <div dangerouslySetInnerHTML={{ __html: safeRenderMarkdown(content) }} />
          </article>
        ) : (
          <div className="space-y-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
              className="border-0 border-b border-border rounded-none px-0 font-display text-4xl md:text-5xl h-auto py-3 shadow-none focus-visible:ring-0" />
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle (optional)"
              className="border-0 border-b border-border rounded-none px-0 text-lg text-muted-foreground italic h-auto py-2 shadow-none focus-visible:ring-0" />
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em]">Cover image</label>
              <ImageUpload
                bucket="post-images"
                userId={user.id}
                value={cover}
                onChange={setCover}
                label="Upload cover"
              />
              <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="…or paste an image URL" />
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell your story… (Markdown supported)"
              className="min-h-[480px] font-sans text-base leading-relaxed" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em]">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 h-9 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em]">Tags (comma-sep)</label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ai, design" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em]">Meta description</label>
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A 1-2 sentence summary…" className="mt-1" />
            </div>
          </div>
        )}
      </div>

      {/* AI sidebar */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-sm border border-border bg-card p-5">
          <h2 className="font-display text-2xl flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI Assistant</h2>
          <p className="mt-1 text-xs text-muted-foreground">Your editorial co-pilot.</p>
          <div className="mt-4 space-y-2">
            {ACTIONS.map((a) => (
              <Button key={a.key} variant="outline" size="sm" disabled={!!busy} onClick={() => runAi(a)} className="w-full justify-start">
                <a.icon className="h-4 w-4" />
                {busy === a.key ? "Thinking…" : a.label}
              </Button>
            ))}
          </div>
          {aiOutput && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Suggestion</p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-sm bg-secondary p-3 text-xs">{aiOutput.content}</pre>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={applyAi}>Apply</Button>
                <Button size="sm" variant="ghost" onClick={() => setAiOutput(null)}>Dismiss</Button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}