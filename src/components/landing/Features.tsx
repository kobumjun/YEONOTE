import { Sparkles, LayoutGrid, Share2 } from "lucide-react";

const items = [
  {
    icon: Sparkles,
    title: "AI 생성",
    body: "한국어·영어 모두 지원. 설명만으로 노션 스타일 페이지를 완성합니다.",
  },
  {
    icon: LayoutGrid,
    title: "블록 에디터",
    body: "헤딩, 토글, 할 일, DB 뷰까지. 드래그 앤 드롭으로 재정렬합니다.",
  },
  {
    icon: Share2,
    title: "탐색 & 공유",
    body: "커뮤니티 템플릿을 찾아 복제하고, 팀과 공유할 수 있습니다.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center font-heading text-2xl font-semibold text-surface-dark dark:text-white sm:text-3xl">
        핵심 기능
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yeo-100 text-yeo-700 dark:bg-yeo-900 dark:text-yeo-200">
              <Icon className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold text-surface-dark dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
