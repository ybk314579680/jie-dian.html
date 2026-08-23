"""五大人格（Big Five / IPIP-50）测试后端。

只负责两件事：
1. GET  /api/questions —— 返回题目（不含正反向标记，避免作弊）
2. POST /api/score      —— 接收答案，计算五个维度的 0~100 分

数据源为 questions.json（IPIP 50 题标准量表，每维度 10 题、5 正 5 反）。
本服务无状态、纯计算，不落库。

启动：uvicorn main:app --reload --port 8000
"""
import json
import os
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUESTIONS_FILE = os.path.join(BASE_DIR, "questions.json")

app = FastAPI(title="Big Five 人格测试 API", version="1.0.0")

# 开发期放开跨域；生产可收紧为具体域名
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- 数据加载 ----------

def _validate_bank(bank: dict) -> None:
    """校验题库结构，发现问题给出明确错误，避免后续 KeyError / 除零崩溃。"""
    if not isinstance(bank, dict):
        raise HTTPException(500, "questions.json 顶层必须是 JSON 对象")
    if "questions" not in bank or not isinstance(bank["questions"], list):
        raise HTTPException(500, "questions.json 缺少 questions 数组")
    if "dimensions" not in bank or not isinstance(bank["dimensions"], dict):
        raise HTTPException(500, "questions.json 缺少 dimensions 对象")

    dims = bank["dimensions"]
    seen_ids = set()
    for q in bank["questions"]:
        if not isinstance(q, dict):
            raise HTTPException(500, "questions 数组中存在非对象元素")
        for field in ("id", "text", "dimension", "direction"):
            if field not in q:
                raise HTTPException(500, f"题目 {q.get('id', '?')} 缺少字段 {field}")
        qid = q["id"]
        if qid in seen_ids:
            raise HTTPException(500, f"题目 id 重复：{qid}")
        seen_ids.add(qid)
        if q["dimension"] not in dims:
            raise HTTPException(
                500, f"题目 {qid} 的维度 {q['dimension']!r} 不在 dimensions 定义中"
            )
        if q["direction"] not in (1, -1):
            raise HTTPException(500, f"题目 {qid} 的 direction 必须是 1 或 -1")

    for key, meta in dims.items():
        if not isinstance(meta, dict) or "name" not in meta or "key" not in meta:
            raise HTTPException(500, f"维度 {key!r} 缺少 name / key 字段")


def _load_bank() -> dict:
    """加载题库，带健壮的格式校验。改坏 questions.json 时给出可定位的错误，而不是 500 崩溃。"""
    try:
        with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
            bank = json.load(f)
    except FileNotFoundError:
        raise HTTPException(500, f"题库文件不存在：{QUESTIONS_FILE}")
    except json.JSONDecodeError as e:
        raise HTTPException(
            500,
            f"questions.json 格式错误（第 {e.lineno} 行第 {e.colno} 列）：{e.msg}。"
            "请检查逗号、引号、括号是否成对。",
        )
    _validate_bank(bank)
    return bank


# ---------- 模型 ----------

class Answer(BaseModel):
    id: int
    value: int = Field(ge=1, le=5)


class ScoreRequest(BaseModel):
    answers: List[Answer]


# ---------- 接口 ----------

@app.get("/api/questions")
def get_questions():
    """返回题目列表。刻意不返回 direction（正反向），只给前端展示所需字段。"""
    bank = _load_bank()
    questions = [
        {
            "id": q["id"],
            "text": q["text"],
            "dimension": q["dimension"],
        }
        for q in bank["questions"]
    ]
    return {
        "version": bank["version"],
        "scale": bank["scale"],
        "dimensions": bank["dimensions"],
        "questions": questions,
    }


@app.post("/api/score")
def score(req: ScoreRequest):
    """计算五个维度 0~100 分。"""
    bank = _load_bank()
    dims = bank["dimensions"]
    scale_min = bank["scale"]["min"]
    scale_max = bank["scale"]["max"]

    # 建立 id -> 题目 的索引
    question_by_id = {q["id"]: q for q in bank["questions"]}

    # 校验：必须答满全部题，且每题 id 合法、无重复
    answered_ids = [a.id for a in req.answers]
    if len(answered_ids) != len(set(answered_ids)):
        raise HTTPException(status_code=400, detail="存在重复的题目答案")
    if set(answered_ids) != set(question_by_id.keys()):
        missing = sorted(set(question_by_id.keys()) - set(answered_ids))
        extra = sorted(set(answered_ids) - set(question_by_id.keys()))
        raise HTTPException(
            status_code=400,
            detail=f"答案不完整或含非法题目。缺失：{missing}，非法：{extra}",
        )

    # 按维度累加原始分（正向直接加，反向翻转）
    raw = {key: 0 for key in dims}
    for a in req.answers:
        q = question_by_id[a.id]
        if q["direction"] == -1:
            raw[q["dimension"]] += (scale_max + 1) - a.value
        else:
            raw[q["dimension"]] += a.value

    # 每维度原始分范围 = [每题数 * scale_min, 每题数 * scale_max]
    # 映射到 0~100： (raw - min) / (max - min) * 100，四舍五入取整
    scores = []
    for key, meta in dims.items():
        count = sum(1 for q in bank["questions"] if q["dimension"] == key)
        if count == 0:
            raise HTTPException(500, f"维度 {key} 没有任何题目，无法计分")
        low = count * scale_min
        high = count * scale_max
        score = round((raw[key] - low) / (high - low) * 100)
        scores.append(
            {
                "key": key,
                "name": meta["name"],
                "letter": meta["key"],
                "score": score,
            }
        )

    return {"version": bank["version"], "scores": scores}


@app.get("/api/health")
def health():
    return {"status": "ok"}
