import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#0a0a0a] px-4 py-14 text-neutral-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo href="/" className="text-white [&_span:last-child]:text-white" />
          <p className="mt-3 max-w-xs text-sm text-neutral-400">
            AI로 빠르게 짜고, 직접 다듬어 완성하는 구조화 템플릿 — YEO와 함께하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-12 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-white">서비스</p>
            <Link href="/#pricing" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              요금제
            </Link>
            <Link href="/explore" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              둘러보기
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-white">계정</p>
            <Link href="/login" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              로그인
            </Link>
            <Link href="/login" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              시작하기
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-white">약관</p>
            <Link href="/privacy" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              개인정보 처리방침
            </Link>
            <Link href="/terms" className="block text-neutral-400 transition-colors duration-200 hover:text-white">
              이용약관
            </Link>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} YEO. All rights reserved.
      </p>
    </footer>
  );
}
