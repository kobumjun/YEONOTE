"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, FilePlus2 } from "lucide-react";
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
import { PRO_CREDIT_PACK_USD, TEAM_CREDIT_PACK_USD } from "@/lib/credits";

const tagOptions = ["생산성", "개인", "비즈니스", "교육", "건강", "재무"];
const styles = ["minimal", "colorful", "corporate", "playful"] as const;

type Step = "choice" | "ai";

export function GenerateModal() {
  const router = useRouter();
  const open = useUiStore((s) => s.generateOpen);
  const setOpen = useUiStore((s) => s.setGenerateOpen);
  const { generateStream, streaming } = useAIGenerate();
  const [step, setStep] = useState<Step>("choice");
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [style, setStyle] = useState<string>("minimal");
  const [progress, setProgress] = useState("");
  const [previewCount, setPreviewCount] = useState(0);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("choice");
      setNoCreditsOpen(false);
    }
  }, [open]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function startBlankTemplate() {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blank: true }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "생성 실패");
      return;
    }
    toast.success("빈 템플릿을 만들었습니다.");
    setOpen(false);
    router.push(`/template/${j.template.id}`);
    router.refresh();
  }

  async function onGenerate() {
    if (!prompt.trim()) {
      toast.error("설명을 입력하세요.");
      return;
    }
    setProgress("");
    setPreviewCount(0);
    try {
      const result = await generateStream(prompt, {
        tags,
        style,
        onProgress: (m) => setProgress(m),
        onBlock: () => setPreviewCount((c) => c + 1),
      });
      if (!result) return;

      const normalized = normalizeAiTemplate(result.payload);
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
      if (typeof result.creditsRemaining === "number") {
        toast.message(`크레딧 1개 사용됨. 남은 크레딧: ${result.creditsRemaining}개`);
      }
      setOpen(false);
      setPrompt("");
      setTags([]);
      setStep("choice");
      router.push(`/template/${j.template.id}`);
      router.refresh();
    } catch (e) {
      const code = e instanceof Error && "code" in e ? (e as Error & { code?: string }).code : undefined;
      if (code === "NO_CREDITS") {
        setNoCreditsOpen(true);
        return;
      }
      toast.error(e instanceof Error ? e.message : "생성 실패");
    }
  }

  function closeAll() {
    setNoCreditsOpen(false);
    setOpen(false);
  }

  async function goCheckout(pack: "pro" | "team") {
    try {
      const res = await fetch(`/api/billing/checkout?plan=${pack}`);
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "체크아웃을 열 수 없습니다.");
        return;
      }
      if (j.url) window.location.href = j.url as string;
      else toast.error("체크아웃 URL이 없습니다.");
    } catch {
      toast.error("체크아웃 요청에 실패했습니다.");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{step === "choice" ? "새 템플릿" : "새 템플릿 · AI 생성"}</DialogTitle>
          </DialogHeader>
          {step === "choice" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep("ai")}
                className="flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition hover:border-yeo-400 hover:shadow-sm"
              >
                <Sparkles className="size-8 text-yeo-600" />
                <span className="font-medium">AI로 생성</span>
                <span className="text-xs text-muted-foreground">설명을 입력하면 풍부한 블록으로 템플릿을 만듭니다. AI 크레딧이 필요합니다.</span>
              </button>
              <button
                type="button"
                onClick={() => void startBlankTemplate()}
                className="flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition hover:border-yeo-400 hover:shadow-sm"
              >
                <FilePlus2 className="size-8 text-yeo-600" />
                <span className="font-medium">빈 템플릿</span>
                <span className="text-xs text-muted-foreground">제목과 빈 문단으로 시작합니다. 블록 추가로 직접 꾸밀 수 있습니다.</span>
              </button>
            </div>
          ) : (
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
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {step === "choice" ? (
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                닫기
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep("choice")}>
                  뒤로
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  닫기
                </Button>
                <Button className="bg-yeo-600" onClick={() => void onGenerate()} disabled={streaming}>
                  {streaming ? "생성 중…" : "생성"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noCreditsOpen} onOpenChange={setNoCreditsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI 크레딧이 부족합니다</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            AI 크레딧이 소진되었습니다. 크레딧을 충전하고 계속 만들어보세요!
          </p>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full bg-yeo-600" onClick={() => void goCheckout("pro")}>
              Pro 크레딧 구매 (${PRO_CREDIT_PACK_USD})
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => void goCheckout("team")}>
              Team 크레딧 구매 (${TEAM_CREDIT_PACK_USD})
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={closeAll}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
