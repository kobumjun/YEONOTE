import { Card, CardContent } from "@/components/ui/card";

const quotes = [
  { quote: "주간 보고 템플릿이 1분 만에 나왔어요.", author: "김민지", role: "PM" },
  { quote: "한국어 프롬프트가 자연스럽게 반영됩니다.", author: "Alex P.", role: "Designer" },
  { quote: "팀 온보딩 문서를 YEO로 통일했습니다.", author: "이도윤", role: "Engineering Lead" },
];

export function Testimonials() {
  return (
    <section className="border-y bg-muted/30 px-4 py-20 dark:bg-slate-900/30">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-2xl font-semibold text-surface-dark dark:text-white sm:text-3xl">
          사용자 후기
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">플레이스홀더 인용 — 실제 배포 시 교체하세요.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.author} className="rounded-xl border bg-card shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed text-foreground">&ldquo;{q.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-surface-dark dark:text-white">{q.author}</p>
                <p className="text-xs text-muted-foreground">{q.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
