import Link from "next/link";

const updatedAt = "2026.04.30";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. 서비스 개요",
    body: [
      "서비스명: YEO (https://yeonote.vercel.app)",
      `최종 수정일: ${updatedAt}`,
    ],
  },
  {
    title: "2. 수집하는 정보",
    body: [
      "Google 계정 정보(이름, 이메일, 프로필 이미지)",
      "회원이 생성·저장하는 템플릿 콘텐츠",
      "AI 생성 관련 기록(프롬프트 및 사용 메타데이터)",
    ],
  },
  {
    title: "3. 정보 이용 목적",
    body: [
      "본인 확인 및 계정 관리",
      "AI 템플릿 생성 기능 제공",
      "서비스 품질·안정성 개선",
    ],
  },
  {
    title: "4. 보관 및 보안",
    body: ["데이터는 Supabase에 저장됩니다. 전송 구간은 암호화됩니다."],
  },
  {
    title: "5. 제3자 서비스",
    body: ["Google OAuth", "OpenAI API", "Lemon Squeezy(결제)"],
  },
  {
    title: "6. 이용자의 권리",
    body: ["관련 법령이 정하는 바에 따라 계정 삭제·데이터보내기 등을 요청할 수 있습니다."],
  },
  {
    title: "7. 쿠키",
    body: ["인증 및 세션 관리에 필요한 최소한의 쿠키를 사용할 수 있습니다."],
  },
  {
    title: "8. 문의",
    body: ["개인정보 관련 문의는 사이트에 안내된 채널로 연락해 주세요."],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← 홈
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            이용약관
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-foreground">개인정보 처리방침</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          YEO 서비스 이용 시 개인정보가 어떻게 처리되는지 안내해 드려요.
        </p>
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
