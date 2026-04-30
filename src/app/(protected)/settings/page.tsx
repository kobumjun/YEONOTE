import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/settings/profile", title: "프로필", desc: "이름, 아바타, 소개" },
  { href: "/settings/billing", title: "결제", desc: "일회성 AI 크레딧, Lemon Squeezy" },
];

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl font-semibold">설정</h1>
      <p className="text-sm text-muted-foreground">계정과 환경을 관리합니다.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full rounded-xl transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{l.title}</CardTitle>
                <CardDescription>{l.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
