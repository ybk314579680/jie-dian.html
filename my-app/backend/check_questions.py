#!/usr/bin/env python3
"""校验 questions.json 的格式与结构，改完题库后运行本脚本快速检查，不必启动后端。

用法：
    python check_questions.py
退出码：0 表示通过，1 表示有问题。
"""
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUESTIONS_FILE = os.path.join(BASE_DIR, "questions.json")


def main() -> int:
    try:
        with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
            bank = json.load(f)
    except FileNotFoundError:
        print(f"[错误] 找不到文件：{QUESTIONS_FILE}")
        return 1
    except json.JSONDecodeError as e:
        print(f"[错误] JSON 格式错误（第 {e.lineno} 行第 {e.colno} 列）：{e.msg}")
        print("  请检查：逗号是否缺失/多余、引号是否成对、括号是否闭合。")
        return 1

    errors = []

    dims = bank.get("dimensions", {})
    questions = bank.get("questions", [])
    if not isinstance(dims, dict):
        errors.append("dimensions 必须是 JSON 对象")
    if not isinstance(questions, list):
        errors.append("questions 必须是 JSON 数组")

    seen_ids = set()
    dim_counts = {k: 0 for k in dims}

    for q in questions:
        if not isinstance(q, dict):
            errors.append("questions 中存在非对象元素")
            continue
        qid = q.get("id")
        for field in ("id", "text", "dimension", "direction"):
            if field not in q:
                errors.append(f"题目 {qid} 缺少字段 {field}")
        if qid in seen_ids:
            errors.append(f"题目 id 重复：{qid}")
        seen_ids.add(qid)

        dim = q.get("dimension")
        if dim not in dims:
            errors.append(f"题目 {qid} 的维度 {dim!r} 未在 dimensions 中定义")
        else:
            dim_counts[dim] += 1
        if q.get("direction") not in (1, -1):
            errors.append(f"题目 {qid} 的 direction 必须是 1 或 -1")

    print(f"题库共 {len(questions)} 题，{len(dims)} 个维度。")
    for k, c in dim_counts.items():
        pos = sum(1 for q in questions if q.get("dimension") == k and q.get("direction") == 1)
        neg = sum(1 for q in questions if q.get("dimension") == k and q.get("direction") == -1)
        print(f"  {k}: 共 {c} 题（正向 {pos} / 反向 {neg}）")

    if errors:
        print("\n[校验失败] 发现以下问题：")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("\n[通过] questions.json 校验通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
