import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const updatedAt = "2026년 4월 30일";

const sections = [
  {
    title: "1. 서비스 정보",
    body: [
      "서비스명: YEO (https://yeonote.vercel.app)",
      `최종 업데이트: ${updatedAt}`,
    ],
  },
  {
    title: "2. 수집하는 정보",
    body: [
      "Google 계정 정보 (이름, 이메일, 프로필 이미지)",
      "사용자가 작성/저장한 템플릿 데이터",
      "AI 생성 로그",
    ],
  },
  {
    title: "3. 이용 목적",
    body: [
      "사용자 인증 및 계정 관리",
      "AI 템플릿 생성 기능 제공",
      "서비스 품질 개선",
    ],
  },
  {
    title: "4. 데이터 저장 및 보호",
    body: ["데이터는 Supabase에 저장되며, 전송 구간은 암호화됩니다."],
  },
  {
    title: "5. 제3자 서비스",
    body: ["Google OAuth", "OpenAI API", "Lemon Squeezy (결제)"],
  },
  {
    title: "6. 이용자 권리",
    body: ["계정 삭제 요청", "데이터 내보내기 요청"],
  },
  {
    title: "7. 쿠키",
    body: ["인증을 위한 최소한의 쿠키만 사용합니다."],
  },
  {
    title: "8. 문의",
    body: ["support@yeonote.app"],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <Logo href="/" />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              서비스 약관
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="font-heading text-3xl font-semibold text-foreground">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-muted-foreground">YEO 서비스 이용 시 개인정보 처리 기준을 안내합니다.</p>

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
