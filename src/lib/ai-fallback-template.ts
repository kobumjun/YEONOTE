import { createBlock } from "@/lib/block-factory";
import type {
  AITemplatePayload,
  BulletedListBlock,
  CalloutBlock,
  ChecklistBlock,
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

/** Starter when generation hits the timeout (no credit charged for this path). */
export function buildTimeoutFallbackTemplate(userPrompt: string): AITemplatePayload {
  const preview = userPrompt.trim().slice(0, 240);

  const h1 = createBlock("heading1") as HeadingBlock;
  h1.content = "루틴 · 기록 템플릿 (간이)";

  const guide = createBlock("callout") as CalloutBlock;
  guide.icon = "📌";
  guide.content =
    "이 템플릿은 운동·식단·지표를 한곳에서 관리하기 위한 예시예요. 위쪽 체크리스트로 습관을, 하위 페이지·토글 안의 표에 세부 로그를 쌓으면 됩니다. AI가 다시 생성하면 주제에 맞게 구조가 달라져요.";

  const intro = createBlock("paragraph") as ParagraphBlock;
  intro.content = `생성이 시간 안에 끝나지 않아 계층 예시만 드려요. 요청 요약: ${preview || "(비어 있음)"}`;

  const hDash = createBlock("heading2") as HeadingBlock;
  hDash.content = "🗓️ 이번 주 리듬";

  const habitCheck = createBlock("checklist") as ChecklistBlock;
  habitCheck.items = [
    { content: "주 3회 이상 운동 세션 완료", checked: false },
    { content: "물 섭취 목표 채우기", checked: false },
    { content: "준비한 식단 기록하기", checked: false },
    { content: "주간 지표 한 번 갱신", checked: false },
  ];

  const miniLog = tableBlock("세부 로그 (예시)", [
    { name: "항목", type: "title" },
    { name: "유형", type: "select", options: ["🏋 운동", "🍽 식사", "😴 수면", "📝 메모", "⏸ 휴식"] },
    { name: "시간(분)", type: "number" },
    { name: "강도", type: "select", options: ["낮음", "중간", "높음", "휴식"] },
    { name: "날짜", type: "date" },
    { name: "메모", type: "text" },
  ]);

  const sub = createBlock("sub_page") as SubPageBlock;
  sub.title = "일별 · 항목별 상세";
  sub.icon = "📂";
  sub.children = [
    createBlock("paragraph") as ParagraphBlock,
    miniLog,
  ];
  (sub.children[0] as ParagraphBlock).content =
    "토글이나 하위 페이지 안에 표와 체크리스트를 두면 깊이가 생깁니다. 여기는 그 패턴의 미니 예시예요.";

  const toggle = createBlock("toggle") as ToggleBlock;
  toggle.title = "💡 빠른 팁 (펼쳐 보기)";
  const tips = createBlock("bulleted_list") as BulletedListBlock;
  tips.items = [
    "같은 열 이름을 여러 표에서 복붙하지 말고 목적별로 나누세요.",
    "날짜 열은 항상 YYYY-MM-DD로 통일하면 필터·정렬이 쉬워요.",
    "주제가 바뀌면 표 개수보다 '토글·체크리스트·하위 페이지' 배치를 먼저 바꿔 보세요.",
  ];
  toggle.children = [tips];

  const warn = createBlock("callout") as CalloutBlock;
  warn.icon = "⚠️";
  warn.content = "더 풍부한 결과를 원하면 네트워크 상태가 좋을 때 다시 생성해 보세요.";

  const h2a = createBlock("heading2") as HeadingBlock;
  h2a.content = "🏋️ Exercise log";
  const pa = createBlock("paragraph") as ParagraphBlock;
  pa.content =
    "운동 세션을 한 줄씩 적습니다. 이름·유형·시간·강도·날짜·메모로 패턴을 추적하세요.";

  const h2b = createBlock("heading2") as HeadingBlock;
  h2b.content = "🍽️ Diet log";
  const pb = createBlock("paragraph") as ParagraphBlock;
  pb.content = "끼니 단위로 기록합니다. 칼로리와 매크로를 숫자로 두면 합산하기 좋아요.";

  const h2c = createBlock("heading2") as HeadingBlock;
  h2c.content = "📈 Progress metrics";
  const pc = createBlock("paragraph") as ParagraphBlock;
  pc.content = "지표마다 한 행을 쓰고 시작·현재·목표값을 갱신하세요.";

  const t1 = tableBlock("Exercise sessions", [
    { name: "Exercise", type: "title" },
    { name: "Type", type: "select", options: ["🏋 Strength", "🏃 Cardio", "🧘 Mobility", "🚶 Walk", "⏸ Rest"] },
    { name: "Duration (mins)", type: "number" },
    { name: "Intensity", type: "select", options: ["⚡ High", "🔋 Medium", "🪫 Low"] },
    { name: "Date", type: "date" },
    { name: "Notes", type: "text" },
  ]);

  const t2 = tableBlock("Meals", [
    { name: "Meal", type: "title" },
    { name: "Category", type: "select", options: ["🍳 Breakfast", "🥗 Lunch", "🍜 Dinner", "🍎 Snack", "☕ Drink"] },
    { name: "Calories", type: "number" },
    { name: "Proteins (g)", type: "number" },
    { name: "Carbs (g)", type: "number" },
    { name: "Fats (g)", type: "number" },
    { name: "Date", type: "date" },
    { name: "Notes", type: "text" },
  ]);

  const t3 = tableBlock("Metrics", [
    { name: "Metric", type: "title" },
    { name: "Starting value", type: "number" },
    { name: "Current value", type: "number" },
    { name: "Target value", type: "number" },
    { name: "Unit", type: "text" },
    { name: "Date", type: "date" },
    { name: "Comments", type: "text" },
  ]);

  const blocks: TemplateBlock[] = [
    h1,
    guide,
    intro,
    hDash,
    habitCheck,
    sub,
    toggle,
    warn,
    h2a,
    pa,
    t1,
    h2b,
    pb,
    t2,
    h2c,
    pc,
    t3,
  ];

  return {
    title: "Starter (timeout)",
    icon: "📄",
    cover: undefined,
    blocks: blocks as unknown[],
  };
}
