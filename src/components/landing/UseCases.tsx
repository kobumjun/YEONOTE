import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cases = [
  {
    emoji: "📋",
    title: "업무 관리",
    subtitle: "프로젝트·운영",
    desc: "프로젝트, 회의, 우선순위를 한 페이지의 구조 안에서 정리해 보세요.",
    preview: ["주간 보드", "액션 아이템", "상태 추적"],
  },
  {
    emoji: "📚",
    title: "공부 플래너",
    subtitle: "학습",
    desc: "과목, 복습 주기, 시간 블록을 한눈에 보이게 계획할 수 있어요.",
    preview: ["주간 목표", "시간 블록", "체크리스트"],
  },
  {
    emoji: "💰",
    title: "가계부",
    subtitle: "개인 재무",
    desc: "수입·지출을 기록하고 카테고리별 요약과 저축 목표를 함께 두세요.",
    preview: ["월간 개요", "카테고리", "저축 목표"],
  },
  {
    emoji: "🏋️",
    title: "운동 플래너",
    subtitle: "건강",
    desc: "운동, 식단, 진행 상황을 깔끔한 대시보드 형태로 기록해 보세요.",
    preview: ["주간 분할", "세트 로그", "회복 메모"],
  },
  {
    emoji: "📖",
    title: "독서 기록",
    subtitle: "취미",
    desc: "읽는 책, 인용, 별점을 나만의 서재 뷰로 모아 보세요.",
    preview: ["읽는 중", "완독", "하이라이트"],
  },
  {
    emoji: "🎯",
    title: "목표 트래커",
    subtitle: "성장",
    desc: "분기 목표와 주간 습관, 가벼운 회고를 한 흐름으로 연결해 보세요.",
    preview: ["목표", "핵심 결과", "주간 회고"],
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          활용 예시
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          YEO로 이런 것들을 만들 수 있어요 — AI로 생성하든 직접 편집하든 내 스타일로 바꿔 쓰세요.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Card
              key={c.title}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <div>
                    <CardTitle className="text-lg tracking-[-0.02em]">{c.title}</CardTitle>
                    <CardDescription className="text-xs">{c.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="mb-2 h-2 w-1/3 rounded bg-border" />
                  <ul className="space-y-1.5">
                    {c.preview.map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-yeo-400" />
                        <span className="truncate">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
