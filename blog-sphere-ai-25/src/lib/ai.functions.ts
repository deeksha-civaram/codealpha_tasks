import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  action: z.enum(["improve", "title", "outline", "summarize", "tags"]),
  text: z.string().min(1).max(20000),
});

const PROMPTS: Record<z.infer<typeof Input>["action"], string> = {
  improve:
    "Improve the following draft. Fix grammar, tighten phrasing, keep the author's voice. Return ONLY the improved markdown text — no preface.",
  title:
    "Suggest 5 compelling, specific blog post titles for the following content. Return as a numbered list. No commentary.",
  outline:
    "Create a structured blog post outline (in markdown with H2/H3 headings and 1-2 bullet sub-points each) for the following topic. Return ONLY the outline.",
  summarize:
    "Write a punchy 2-sentence meta description (max 160 chars) for SEO based on the following content. Return ONLY the description.",
  tags:
    "Suggest 5 relevant, lowercase, single-or-two-word tags for the following content. Return ONLY a comma-separated list.",
};

export const aiAssist = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a sharp editorial writing assistant for a premium blogging platform." },
          { role: "user", content: `${PROMPTS[data.action]}\n\n---\n${data.text}` },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please top up in workspace settings.");
      throw new Error(`AI request failed (${res.status}).`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { content };
  });
