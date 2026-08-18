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

def _load_bank() -> dict:
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


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
