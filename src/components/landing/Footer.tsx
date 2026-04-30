import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t bg-surface-dark px-4 py-12 text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo href="/" className="text-white [&_span:last-child]:text-white" />
          <p className="mt-3 max-w-xs text-sm text-slate-400">AI로 템플릿을 설계하고, 편집하고, 공유하세요.</p>
        </div>
        <div className="flex flex-wrap gap-10 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-white">제품</p>
            <Link href="/#pricing" className="block hover:text-white">
              요금제
            </Link>
            <Link href="/explore" className="block hover:text-white">
              탐색
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-white">계정</p>
            <Link href="/login" className="block hover:text-white">
              로그인
            </Link>
            <Link href="/signup" className="block hover:text-white">
              회원가입
            </Link>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-center text-xs text-slate-500">© {new Date().getFullYear()} YEO. All rights reserved.</p>
    </footer>
  );
}
