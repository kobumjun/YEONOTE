import { createBlock } from "@/lib/block-factory";
import type {
  AITemplatePayload,
  CalloutBlock,
  DatabaseColumn,
  DatabaseTableBlock,
  HeadingBlock,
  ParagraphBlock,
  TemplateBlock,
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
  h1.content = "Routine tracker (starter)";

  const intro = createBlock("paragraph") as ParagraphBlock;
  intro.content = `AI 생성이 시간 제한 안에 완료되지 않아 기본 골격만 드려요. 아래 표는 각각 다른 목적을 가진 예시 구조입니다. 편집해서 채워 넣거나, 다시 생성해 보세요.\n\n요청 요약: ${preview || "(비어 있음)"}`;

  const warn = createBlock("callout") as CalloutBlock;
  warn.icon = "⚠️";
  warn.content =
    "더 풍부한 결과를 원하면 설명을 조금 짧게 하거나, 네트워크 상태가 좋을 때 다시 시도해 보세요. 각 섹션은 '설명 문단 + 전용 표' 형태로 확장하면 좋아요.";

  const h2a = createBlock("heading2") as HeadingBlock;
  h2a.content = "🏋️ Exercise log";
  const pa = createBlock("paragraph") as ParagraphBlock;
  pa.content =
    "여기에 운동 세션을 한 줄씩 적습니다. 운동 이름과 유형을 적고, 소요 시간과 강도를 선택한 뒤 날짜와 메모로 패턴을 추적하세요. 주간으로 복사해 쓰면 주기 비교가 쉬워요.";

  const h2b = createBlock("heading2") as HeadingBlock;
  h2b.content = "🍽️ Diet log";
  const pb = createBlock("paragraph") as ParagraphBlock;
  pb.content =
    "식사 단위로 기록합니다. 끼니 이름과 카테고리를 적고 칼로리·매크로를 숫자로 넣으세요. 같은 날 여러 끼니를 구분하려면 메모 열에 시간대를 적어 두면 됩니다.";

  const h2c = createBlock("heading2") as HeadingBlock;
  h2c.content = "📈 Progress metrics";
  const pc = createBlock("paragraph") as ParagraphBlock;
  pc.content =
    "측정하고 싶은 지표마다 한 행을 씁니다. 시작값·현재값·목표값을 숫자로 두고 주기마다 날짜를 갱신하세요. 코멘트에는 측정 조건이나 장비를 적어 두면 나중에 해석이 쉬워요.";

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

  const blocks: TemplateBlock[] = [h1, intro, warn, h2a, pa, t1, h2b, pb, t2, h2c, pc, t3];

  return {
    title: "Starter (timeout)",
    icon: "📄",
    cover: undefined,
    blocks: blocks as unknown[],
  };
}
