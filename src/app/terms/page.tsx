import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const updatedAt = "2026년 4월 30일";

const sections = [
  {
    title: "1. 서비스 개요",
    body: ["YEO는 AI 기반 템플릿/메모 생성 도구입니다."],
  },
  {
    title: "2. 계정 정책",
    body: ["Google OAuth 로그인 기반이며, 1인 1계정 사용을 원칙으로 합니다."],
  },
  {
    title: "3. 크레딧 정책",
    body: ["구매한 크레딧은 환불되지 않습니다.", "크레딧은 만료되지 않습니다."],
  },
  {
    title: "4. 허용되지 않는 사용",
    body: ["불법, 유해, 학대적 콘텐츠 생성/배포 목적으로 사용할 수 없습니다."],
  },
  {
    title: "5. 지식재산권",
    body: ["사용자가 생성한 템플릿의 권리는 사용자에게 있습니다."],
  },
  {
    title: "6. AI 콘텐츠 안내",
    body: ["AI 결과의 정확성을 보장하지 않으며, 최종 검토 책임은 사용자에게 있습니다."],
  },
  {
    title: "7. 서비스 가용성",
    body: ["서비스는 최선의 노력으로 제공되며 특정 업타임을 보장하지 않습니다."],
  },
  {
    title: "8. 책임 제한",
    body: ["법이 허용하는 범위 내에서 서비스 제공자의 책임은 제한됩니다."],
  },
  {
    title: "9. 계정 제한/종료",
    body: ["약관 위반 계정은 사전 통지 후 또는 즉시 제한/정지될 수 있습니다."],
  },
  {
    title: "10. 약관 변경",
    body: ["약관은 필요 시 변경될 수 있으며, 주요 변경은 공지 후 적용됩니다.", `최종 업데이트: ${updatedAt}`],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <Logo href="/" />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="font-heading text-3xl font-semibold text-foreground">서비스 약관</h1>
        <p className="mt-2 text-sm text-muted-foreground">YEO 서비스 이용을 위한 기본 약관입니다.</p>

        <div className="mt-8 space-y-5">
          {sections.map((section) => (
            <section key={section.title} className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {section.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
