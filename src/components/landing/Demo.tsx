"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

const steps = [
  "요청 분석 중…",
  "블록 구조 설계…",
  "데이터베이스 뷰 생성…",
  "마무리 중…",
];

export function Demo() {
  const [i, setI] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const sample =
    "주간 업무 스케줄 템플릿 — 월~금 요일별 할 일, 우선순위, 상태를 관리합니다.";

  useEffect(() => {
    const t = setInterval(() => {
      setI((x) => (x + 1) % steps.length);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let j = 0;
    const id = setInterval(() => {
      j += 1;
      setLines(sample.slice(0, j).split("\n").slice(-3));
      if (j >= sample.length) {
        clearInterval(id);
      }
    }, 35);
    return () => clearInterval(id);
  }, [sample]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-center font-heading text-2xl font-semibold text-surface-dark dark:text-white sm:text-3xl">
        실시간 생성 데모
      </h2>
      <p className="mt-2 text-center text-muted-foreground">AI가 템플릿을 조립하는 과정을 시뮬레이션합니다.</p>
      <Card className="mt-10 overflow-hidden rounded-xl border shadow-md transition-all duration-200">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b bg-muted/40 p-6 md:border-b-0 md:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">입력</p>
            <p className="mt-3 min-h-[4.5rem] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {lines.join("")}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-yeo-500 align-middle" />
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-yeo-500 transition-all duration-500"
                style={{ width: `${((i + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-yeo-600 dark:text-yeo-400">{steps[i]}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">미리보기</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg border bg-card p-3 shadow-sm">📋 주간 업무 스케줄</div>
              <div className="rounded-lg border border-yeo-200 bg-yeo-50/80 p-3 dark:border-yeo-800 dark:bg-yeo-950/40">
                💡 월요일에 이번 주 계획을 세우세요.
              </div>
              <div className="rounded-lg border bg-card p-3 text-muted-foreground shadow-sm">▸ 월요일 (3)</div>
              <div className="h-2 rounded bg-muted" />
              <div className="rounded-lg border bg-card p-2 text-xs shadow-sm">표 · 업무 트래커</div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
