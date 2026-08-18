"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// 后端地址已硬编码为线上地址，不依赖环境变量
const API_BASE = "https://mocaituoran.cn";
const PAGE_SIZE = 5;
const GOLD = "#d4af37";

interface Question {
  id: number;
  text: string;
  dimension: string;
}
interface DimMeta {
  name: string;
  key: string;
}
interface Scale {
  min: number;
  max: number;
  labels: Record<string, string>;
}
interface QuestionsPayload {
  version: string;
  scale: Scale;
  dimensions: Record<string, DimMeta>;
  questions: Question[];
}
interface ScoreItem {
  key: string;
  name: string;
  letter: string;
  score: number;
}

type Phase = "loading" | "quiz" | "submitting" | "result" | "error";

// 每个维度的分数区间解读（0~33 低 / 34~66 中 / 67~100 高）
const DESCRIPTIONS: Record<string, [string, string, string]> = {
  openness: [
    "务实传统，偏好熟悉、具体的经验。",
    "在守旧与求新之间保持平衡。",
    "好奇心强，喜欢新体验与抽象思考，想象力丰富。",
  ],
  conscientiousness: [
    "随性灵活，不拘泥于计划，更看重顺其自然。",
    "在条理与灵活之间保持平衡。",
    "自律可靠，做事有计划、有始有终。",
  ],
  extraversion: [
    "安静内敛，倾向独处和小范围交往。",
    "在独处与社交之间游刃有余。",
    "精力充沛，喜欢社交，从人群中获得能量。",
  ],
  agreeableness: [
    "直率独立，敢于坚持立场、表达不同意见。",
    "在竞争与合作之间保持平衡。",
    "善解人意，乐于合作，重视他人感受。",
  ],
  neuroticism: [
    "情绪稳定，抗压能力强，很少被小事困扰。",
    "情绪反应适中，起伏在正常范围。",
    "情绪敏锐，容易感知压力与情绪波动。",
  ],
};

function levelOf(score: number): 0 | 1 | 2 {
  if (score <= 33) return 0;
  if (score <= 66) return 1;
  return 2;
}

export default function PersonalityPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scale, setScale] = useState<Scale | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/questions`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: QuestionsPayload = await res.json();
        if (cancelled) return;
        setQuestions(data.questions);
        setScale(data.scale);
        setPhase("quiz");
      } catch (e) {
        if (cancelled) return;
        setError(
          "无法加载题目，请确认后端服务已启动（uvicorn main:app --port 8000）。"
        );
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const pageQuestions = useMemo(
    () => questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [questions, page]
  );
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;

  const setAnswer = useCallback((id: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const submit = useCallback(async () => {
    const missing = questions.filter((q) => answers[q.id] == null);
    if (missing.length > 0) {
      setError(`还有 ${missing.length} 题未作答，请完成后再提交。`);
      return;
    }
    setError("");
    setPhase("submitting");
    try {
      const payload = {
        answers: questions.map((q) => ({ id: q.id, value: answers[q.id] })),
      };
      const res = await fetch(`${API_BASE}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setScores(data.scores);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败，请稍后重试。");
      setPhase("quiz");
    }
  }, [answers, questions]);

  const restart = useCallback(() => {
    setAnswers({});
    setScores([]);
    setPage(0);
    setError("");
    setPhase("quiz");
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">五大人格测试</h1>
      <p className="mb-8 text-sm text-foreground/60">
        基于 IPIP-50 量表，从开放性、尽责性、外向性、宜人性、神经质五个维度为你画像。
        本测试仅作参考，人格没有好坏之分。
      </p>

      {phase === "loading" && (
        <p className="text-foreground/60">题目加载中…</p>
      )}

      {phase === "error" && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <p>{error}</p>
        </div>
      )}

      {phase === "quiz" && scale && (
        <div>
          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between text-xs text-foreground/60">
              <span>
                进度 {answeredCount} / {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: GOLD }}
              />
            </div>
          </div>

          <div className="mb-3 text-xs text-foreground/50">
            1 = 非常不同意，5 = 非常同意（第 {page + 1} / {totalPages} 页）
          </div>

          <div className="grid gap-4">
            {pageQuestions.map((q) => {
              const chosen = answers[q.id];
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4"
                >
                  <div className="mb-3 text-sm leading-relaxed">
                    <span className="mr-2 text-foreground/40">{q.id}.</span>
                    {q.text}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="mr-1 hidden w-10 text-right text-xs text-foreground/40 sm:inline">
                      不同意
                    </span>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAnswer(q.id, v)}
                        aria-label={`${v}`}
                        className="flex h-9 flex-1 items-center justify-center rounded-lg border text-sm transition"
                        style={
                          chosen === v
                            ? {
                                borderColor: GOLD,
                                backgroundColor: `${GOLD}22`,
                                color: GOLD,
                              }
                            : {
                                borderColor: "rgba(128,128,128,0.25)",
                                color: "var(--foreground)",
                                opacity: 0.7,
                              }
                        }
                      >
                        {v}
                      </button>
                    ))}
                    <span className="ml-1 hidden w-10 text-xs text-foreground/40 sm:inline">
                      同意
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-foreground/15 px-4 py-2 text-sm transition hover:border-foreground/40 disabled:opacity-30"
            >
              上一页
            </button>

            {page < totalPages - 1 ? (
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded-lg px-4 py-2 text-sm text-foreground/80 transition hover:text-foreground"
              >
                下一页 →
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="rounded-lg px-6 py-2 text-sm font-medium text-zinc-900 transition hover:opacity-90"
                style={{ backgroundColor: GOLD }}
              >
                提交并查看结果
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <p className="text-foreground/60">正在计算你的画像…</p>
      )}

      {phase === "result" && (
        <ResultView scores={scores} onRestart={restart} />
      )}
    </main>
  );
}

function ResultView({
  scores,
  onRestart,
}: {
  scores: ScoreItem[];
  onRestart: () => void;
}) {
  return (
    <div>
      <div className="mb-8 flex flex-col items-center">
        <RadarChart scores={scores} />
      </div>

      <div className="grid gap-5">
        {scores.map((s) => (
          <div key={s.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-xs text-foreground/40">
                  {s.letter} · {s.key === "neuroticism" ? "情绪敏感性" : ""}
                </span>
              </div>
              <span
                className="text-sm font-medium tabular-nums"
                style={{ color: GOLD }}
              >
                {s.score}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${s.score}%`, backgroundColor: GOLD }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground/55">
              {DESCRIPTIONS[s.key][levelOf(s.score)]}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-foreground/40">
        分数范围 0~100。神经质维度分数越高代表越容易产生情绪波动，与“好坏”无关。
      </p>

      <button
        type="button"
        onClick={onRestart}
        className="mt-8 rounded-lg border border-foreground/15 px-5 py-2 text-sm transition hover:border-foreground/40"
      >
        重新测试
      </button>
    </div>
  );
}

function RadarChart({ scores }: { scores: ScoreItem[] }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const R = 100;
  const n = scores.length;

  const point = useCallback(
    (r: number, i: number): [number, number] => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    },
    [cx, cy, n]
  );

  const ring = (level: number) =>
    scores
      .map((_, i) => point(R * (level / 5), i))
      .map(([x, y]) => `${x},${y}`)
      .join(" ");

  const dataPoly = scores
    .map((s, i) => point(R * (s.score / 100), i))
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  const labelPos = scores.map((_, i) => point(R + 26, i));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: 340 }}
      role="img"
      aria-label="五大人格雷达图"
    >
      {[1, 2, 3, 4, 5].map((lvl) => (
        <polygon
          key={lvl}
          points={ring(lvl)}
          fill="none"
          stroke="rgba(128,128,128,0.3)"
          strokeWidth="0.5"
        />
      ))}
      {scores.map((_, i) => {
        const [x, y] = point(R, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(128,128,128,0.3)"
            strokeWidth="0.5"
          />
        );
      })}

      <polygon
        points={dataPoly}
        fill={`${GOLD}26`}
        stroke={GOLD}
        strokeWidth="1.5"
      />

      {scores.map((s, i) => {
        const [x, y] = point(R * (s.score / 100), i);
        return <circle key={s.key} cx={x} cy={y} r="3" fill={GOLD} />;
      })}

      {scores.map((s, i) => {
        const [x, y] = labelPos[i];
        const anchor =
          Math.abs(x - cx) < 5 ? "middle" : x > cx ? "start" : "end";
        return (
          <g key={s.key}>
            <text
              x={x}
              y={y - 4}
              textAnchor={anchor}
              fontSize="12"
              fill="#9ca3af"
            >
              {s.name}
            </text>
            <text
              x={x}
              y={y + 12}
              textAnchor={anchor}
              fontSize="13"
              fontWeight="600"
              fill={GOLD}
            >
              {s.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
