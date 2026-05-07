import { Sparkles, LayoutGrid, Share2 } from "lucide-react";

const items = [
  {
    icon: Sparkles,
    title: "AI 생성",
    body: "평소 말하듯 필요를 적으면 YEO가 풍부한 구조의 블록을 자동으로 조립해 드려요.",
  },
  {
    icon: LayoutGrid,
    title: "블록 에디터",
    body: "제목, 토글, 할 일, 데이터베이스 등 다양한 블록을 드래그 앤 드롭으로 순서를 바꿀 수 있어요.",
  },
  {
    icon: Share2,
    title: "둘러보기와 공유",
    body: "템플릿을 둘러보기에 공개하거나, 마음에 드는 걸 내 작업공간으로 복제하고, 읽기 전용 링크로 공유할 수 있어요.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        이런 점이 좋아요
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        한 문장에서 완성도 있는 워크스페이스 레이아웃까지, 필요한 도구를 한곳에 모았어요.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-yeo-600 dark:text-yeo-400">
              <Icon className="size-5 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
