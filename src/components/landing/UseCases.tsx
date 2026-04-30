import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cases = [
  {
    emoji: "📋",
    title: "업무 관리",
    subtitle: "Work Management",
    desc: "프로젝트·회의·우선순위를 한 페이지에서 정리합니다.",
    preview: ["주간 보드", "액션 아이템", "상태 추적"],
  },
  {
    emoji: "📚",
    title: "학습 플래너",
    subtitle: "Study Planner",
    desc: "과목별 계획과 복습 루틴을 시각적으로 관리합니다.",
    preview: ["이번 주 목표", "시간 블록", "체크리스트"],
  },
  {
    emoji: "💰",
    title: "가계부",
    subtitle: "Budget Tracker",
    desc: "수입·지출·카테고리별 요약으로 소비 패턴을 파악합니다.",
    preview: ["월별 요약", "카테고리", "목표 저축"],
  },
  {
    emoji: "🏋️",
    title: "운동 루틴",
    subtitle: "Workout Routine",
    desc: "세트·횟수·부위별 기록으로 꾸준한 운동을 돕습니다.",
    preview: ["주간 스플릿", "세트 로그", "휴식 타이머"],
  },
  {
    emoji: "📖",
    title: "독서 기록",
    subtitle: "Reading Log",
    desc: "읽은 책·메모·평점을 모아 개인 서재를 만듭니다.",
    preview: ["읽는 중", "완독", "인용 메모"],
  },
  {
    emoji: "🎯",
    title: "목표 관리",
    subtitle: "Goal Tracker",
    desc: "분기별 OKR과 일일 습관을 연결해 실행력을 높입니다.",
    preview: ["핵심 목표", "핵심 결과", "주간 리뷰"],
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold text-surface-dark dark:text-white sm:text-3xl">
          사용 예시
        </h2>
        <p className="mt-2 text-center text-muted-foreground">YEO 템플릿으로 만들 수 있는 카테고리 예시입니다.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Card key={c.title} className="overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <div>
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                    <CardDescription className="text-xs">{c.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{c.desc}</p>
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="mb-2 h-2 w-1/3 rounded bg-yeo-200/80 dark:bg-yeo-800" />
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
