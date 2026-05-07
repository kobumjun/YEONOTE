"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

const steps = ["요청 분석 중…", "블록 구조 설계 중…", "데이터베이스 뷰 구성 중…", "레이아웃 마무리 중…"];

export function Demo() {
  const [i, setI] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const sample =
    "주간 프로젝트 관리 템플릿으로, 할 일 추적, 회의 메모, 스프린트 계획까지 한 페이지에 정리하고 싶어요.";

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
      <h2 className="text-center font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        실시간 미리보기
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        한 줄 설명이 구조화된 템플릿으로 바뀌는 과정을 미리 확인하세요.
      </p>
      <Card className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-border bg-muted/30 p-6 md:border-b-0 md:border-r md:border-border">
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
              <div className="rounded-lg border border-border bg-card p-3 shadow-sm">📋 주간 프로젝트 허브</div>
              <div className="rounded-lg border border-yeo-200/60 bg-yeo-50/50 p-3 dark:border-yeo-900 dark:bg-yeo-950/30">
                💡 월요일에 스프린트를 계획하고, 메모는 바로 옆에 적어 두세요.
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-muted-foreground shadow-sm">▸ 이번 주 (3)</div>
              <div className="h-2 rounded bg-muted" />
              <div className="rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground shadow-sm">
                표 · 할 일 추적
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
