import Link from "next/link";

const updatedAt = "2026.04.30";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. 서비스 개요",
    body: ["YEO는 AI를 활용한 템플릿·노트 작성 도구입니다."],
  },
  {
    title: "2. 계정",
    body: ["계정은 Google OAuth로 연결됩니다. 원칙적으로 한 사람이 하나의 계정을 사용합니다."],
  },
  {
    title: "3. 크레딧",
    body: ["구매한 크레딧은 법령이 정한 경우를 제외하고 환불되지 않을 수 있습니다.", "별도 안내가 없는 한 크레딧은 소멸되지 않습니다."],
  },
  {
    title: "4. 허용 사용",
    body: ["YEO를 이용해 불법·유해·학대적 콘텐츠를 만들거나 배포해서는 안 됩니다."],
  },
  {
    title: "5. 지식재산",
    body: ["회원이 만든 템플릿에 대한 권리는 회원에게 있으며, 포함된 제3자 콘텐츠는 각 권리자의 약관을 따릅니다."],
  },
  {
    title: "6. AI 생성 콘텐츠",
    body: ["AI 결과는 부정확할 수 있어요. 활용 전에 반드시 검토할 책임은 이용자에게 있습니다."],
  },
  {
    title: "7. 가용성",
    body: ["서비스는 최선을 다해 제공되며, 특정 가동 시간을 보장하지는 않습니다."],
  },
  {
    title: "8. 책임의 한계",
    body: ["법령이 허용하는 한도 내에서 YEO의 책임은 제한될 수 있습니다."],
  },
  {
    title: "9. 이용 정지·해지",
    body: ["약관 위반 시 사전 통지 없이 또는 통지 후 계정을 정지·해지할 수 있습니다."],
  },
  {
    title: "10. 약관 변경",
    body: ["약관은 변경될 수 있으며, 중요한 변경은 합리적인 방법으로 안내합니다.", `최종 수정일: ${updatedAt}`],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← 홈
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
            개인정보 처리방침
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-foreground">이용약관</h1>
        <p className="mt-2 text-sm text-muted-foreground">YEO 이용과 관련된 기본 약관입니다.</p>
        <div className="mt-10 space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{s.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {s.body.map((line) => (
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
