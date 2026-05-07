import { createBlock } from "@/lib/block-factory";
import type {
  AITemplatePayload,
  BulletedListBlock,
  CalloutBlock,
  ChecklistBlock,
  ChecklistItem,
  DatabaseColumn,
  DatabaseTableBlock,
  HeadingBlock,
  ParagraphBlock,
  SubPageBlock,
  TemplateBlock,
  ToggleBlock,
} from "@/types/template";
import { padDatabaseRowsToMin } from "@/types/template";

function tableBlock(title: string, columns: DatabaseColumn[]): DatabaseTableBlock {
  const b = createBlock("database_table") as DatabaseTableBlock;
  b.title = title;
  b.columns = columns;
  b.rows = padDatabaseRowsToMin(columns, []);
  return b;
}

function monthDayChecklistItems(year: number, monthIndexZeroBased: number): ChecklistItem[] {
  const last = new Date(year, monthIndexZeroBased + 1, 0).getDate();
  const wdays = ["일", "월", "화", "수", "목", "금", "토"];
  const items: ChecklistItem[] = [];
  for (let d = 1; d <= last; d++) {
    const dt = new Date(year, monthIndexZeroBased, d);
    const wk = wdays[dt.getDay()];
    items.push({ content: `${monthIndexZeroBased + 1}/${d} (${wk})`, checked: false });
  }
  return items;
}

function detailSubPage(id: string, title: string): SubPageBlock {
  const b = createBlock("sub_page") as SubPageBlock;
  b.id = id;
  b.title = title;
  b.icon = "📂";
  const intro = createBlock("paragraph") as ParagraphBlock;
  intro.content = "";
  const log = tableBlock("세부 기록", [
    { name: "날짜", type: "date" },
    { name: "항목", type: "title" },
    { name: "메모", type: "text" },
    { name: "상태", type: "select", options: ["계획", "진행", "완료", "보류"] },
    { name: "시간(분)", type: "number" },
  ]);
  b.children = [intro, log];
  return b;
}

/** Starter when generation hits the timeout (no credit charged for this path). */
export function buildTimeoutFallbackTemplate(userPrompt: string): AITemplatePayload {
  const preview = userPrompt.trim().slice(0, 240);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const h1 = createBlock("heading1") as HeadingBlock;
  h1.content = "루틴 · 기록 (타임아웃 기본 골격)";

  const guide = createBlock("callout") as CalloutBlock;
  guide.icon = "📌";
  guide.content =
    "마스터 표에서 연결된 행을 누르면 아래 상세 영역으로 이동합니다. 표 칸은 비어 있으니 직접 채워 주세요. AI로 다시 생성하면 주제에 맞게 규모와 구조가 달라집니다.";

  const intro = createBlock("paragraph") as ParagraphBlock;
  intro.content = `생성이 시간 안에 끝나지 않아 최소 연결 예시만 드립니다. 요청: ${preview || "(없음)"}`;

  const hGoals = createBlock("heading2") as HeadingBlock;
  hGoals.content = "🎯 목표";
  const goalsTable = tableBlock("목표", [
    { name: "목표", type: "title" },
    { name: "목표값", type: "text" },
    { name: "기한", type: "date" },
    { name: "달성", type: "checkbox" },
    { name: "메모", type: "text" },
  ]);

  const hCal = createBlock("heading2") as HeadingBlock;
  hCal.content = "📅 이번 달 캘린더";
  const calCheck = createBlock("checklist") as ChecklistBlock;
  calCheck.items = monthDayChecklistItems(y, m);

  const hMaster = createBlock("heading2") as HeadingBlock;
  hMaster.content = "🏋️ 마스터 목록 (행 연결 예시)";
  const master = tableBlock("마스터", [
    { name: "이름", type: "title" },
    { name: "분류", type: "select", options: ["A", "B", "C", "D"] },
    { name: "목표 횟수/주", type: "number" },
    { name: "최근 일자", type: "date" },
    { name: "메모", type: "text" },
  ]);
  master.rows[0].linkedSectionId = "detail-slot-1";
  master.rows[1].linkedSectionId = "detail-slot-2";
  master.rows[2].linkedSectionId = "detail-slot-3";

  const sp1 = detailSubPage("detail-slot-1", "상세 ①");
  const sp2 = detailSubPage("detail-slot-2", "상세 ②");
  const sp3 = detailSubPage("detail-slot-3", "상세 ③");

  const hLog = createBlock("heading2") as HeadingBlock;
  hLog.content = "📝 일별 로그";
  const daily = tableBlock("일별 기록", [
    { name: "날짜", type: "date" },
    { name: "항목", type: "title" },
    { name: "세트", type: "number" },
    { name: "반복", type: "number" },
    { name: "중량(kg)", type: "number" },
    { name: "휴식(초)", type: "number" },
    { name: "메모", type: "text" },
  ]);

  const hHyd = createBlock("heading2") as HeadingBlock;
  hHyd.content = "💧 수분 · 보충";
  const hyd = createBlock("checklist") as ChecklistBlock;
  hyd.items = [
    { content: "물 500ml — 기상 직후", checked: false },
    { content: "물 500ml — 오전", checked: false },
    { content: "물 500ml — 점심 후", checked: false },
    { content: "물 500ml — 운동 전", checked: false },
    { content: "물 500ml — 운동 후", checked: false },
    { content: "물 500ml — 저녁", checked: false },
    { content: "프로틴", checked: false },
    { content: "비타민", checked: false },
    { content: "크레아틴", checked: false },
  ];

  const hRev = createBlock("heading2") as HeadingBlock;
  hRev.content = "📊 주간 회고";
  const revToggle = createBlock("toggle") as ToggleBlock;
  revToggle.title = "▶ 이번 주 회고";
  const revBullets = createBlock("bulleted_list") as BulletedListBlock;
  revBullets.items = ["", "", ""];
  revToggle.children = [revBullets];

  const warn = createBlock("callout") as CalloutBlock;
  warn.icon = "⚠️";
  warn.content = "네트워크가 안정적일 때 다시 생성해 보세요.";

  const blocks: TemplateBlock[] = [
    h1,
    guide,
    intro,
    hGoals,
    goalsTable,
    hCal,
    calCheck,
    hMaster,
    master,
    sp1,
    sp2,
    sp3,
    hLog,
    daily,
    hHyd,
    hyd,
    hRev,
    revToggle,
    warn,
  ];

  return {
    title: "Starter (timeout)",
    icon: "📄",
    cover: undefined,
    blocks: blocks as unknown[],
  };
}
