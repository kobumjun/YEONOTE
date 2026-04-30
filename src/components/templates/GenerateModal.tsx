"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/uiStore";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { normalizeAiTemplate } from "@/types/template";

const tagOptions = ["생산성", "개인", "비즈니스", "교육", "건강", "재무"];
const styles = ["minimal", "colorful", "corporate", "playful"] as const;

export function GenerateModal() {
  const router = useRouter();
  const open = useUiStore((s) => s.generateOpen);
  const setOpen = useUiStore((s) => s.setGenerateOpen);
  const { generateStream, streaming } = useAIGenerate();
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [style, setStyle] = useState<string>("minimal");
  const [progress, setProgress] = useState("");
  const [previewCount, setPreviewCount] = useState(0);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function onGenerate() {
    if (!prompt.trim()) {
      toast.error("설명을 입력하세요.");
      return;
    }
    setProgress("");
    setPreviewCount(0);
    const payload = await generateStream(prompt, {
      tags,
      style,
      onProgress: (m) => setProgress(m),
      onBlock: () => setPreviewCount((c) => c + 1),
    });
    if (!payload) return;

    const normalized = normalizeAiTemplate(payload);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: normalized.title,
        icon: normalized.icon,
        cover: normalized.cover,
        content: { blocks: normalized.blocks },
        tags,
        category: tags[0] ?? null,
        ai_prompt: prompt,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "저장 실패");
      return;
    }
    toast.success("템플릿이 생성되었습니다.");
    setOpen(false);
    setPrompt("");
    setTags([]);
    router.push(`/template/${j.template.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>새 템플릿 · AI 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt">무엇을 만들까요?</Label>
            <Textarea
              id="prompt"
              rows={5}
              placeholder="예: 주간 업무 스케줄 템플릿. 월~금 요일별 할 일, 우선순위와 상태를 관리하게 해줘."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 rounded-lg"
            />
          </div>
          <div>
            <Label>태그 (선택)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tagOptions.map((t) => (
                <Badge
                  key={t}
                  variant={tags.includes(t) ? "default" : "outline"}
                  className="cursor-pointer rounded-md"
                  onClick={() => toggleTag(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>스타일 (선택)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {styles.map((s) => (
                <Badge
                  key={s}
                  variant={style === s ? "default" : "outline"}
                  className="cursor-pointer rounded-md capitalize"
                  onClick={() => setStyle(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          {streaming && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-yeo-600" />
                <span>{progress || "생성 중…"}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">블록 {previewCount}개 수신</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            닫기
          </Button>
          <Button className="bg-yeo-600" onClick={onGenerate} disabled={streaming}>
            {streaming ? "생성 중…" : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
