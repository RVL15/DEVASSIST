from core.config import settings

SYSTEM_BASE = (
    "You are DevAssist, an expert AI coding assistant. "
    "Be precise, concise, and produce production-quality code. "
    "Never add unnecessary explanation unless asked."
)


def _truncate(text: str) -> str:
    return text[: settings.MAX_FILE_CHARS]


# ── Autocomplete ──────────────────────────────────────────────────────────────

def autocomplete_prompt(prefix: str, suffix: str, context: str = "", language: str = "") -> str:
    lang = f"[{language}] " if language and language != "auto" else ""
    ctx_block = f"\n\n# File context:\n{_truncate(context)}" if context else ""
    return (
        f"{lang}Complete the code. Output ONLY the completion, no explanation.{ctx_block}\n\n"
        f"# Code before cursor:\n{prefix}\n\n"
        f"# Code after cursor:\n{suffix}\n\n"
        f"# Completion:"
    )


# ── Explain ───────────────────────────────────────────────────────────────────

def explain_prompt(code: str, language: str, detail: str) -> str:
    level = "in simple terms (2-3 sentences)" if detail == "brief" else "thoroughly (purpose, logic, edge cases)"
    return (
        f"Explain this {language} code {level}:\n\n```{language}\n{_truncate(code)}\n```"
    )


# ── Bug Detection ─────────────────────────────────────────────────────────────

def bugfix_prompt(code: str, language: str, context: str = "") -> str:
    ctx = f"\n\nFile context:\n{_truncate(context)}" if context else ""
    return (
        f"Analyze this {language} code for bugs (logical, syntax, performance, security).{ctx}\n\n"
        f"```{language}\n{_truncate(code)}\n```\n\n"
        "Respond ONLY as JSON array:\n"
        '[{"line": <int|null>, "type": "<logical|syntax|performance|security>", '
        '"description": "<issue>", "fix": "<fixed code or explanation>"}]\n\n'
        "If no bugs, return []."
    )


# ── Refactor ──────────────────────────────────────────────────────────────────

def refactor_prompt(code: str, language: str, goals: list) -> str:
    goal_str = ", ".join(goals)
    return (
        f"Refactor this {language} code for: {goal_str}.\n\n"
        f"```{language}\n{_truncate(code)}\n```\n\n"
        "Respond as JSON:\n"
        '{"refactored_code": "<code>", "changes": ["<change1>", "<change2>"]}'
    )


# ── Generate ──────────────────────────────────────────────────────────────────

def generate_prompt(prompt: str, language: str, context: str = "") -> str:
    ctx = f"\n\nFile context:\n{_truncate(context)}" if context else ""
    return (
        f"Generate {language} code for: {prompt}{ctx}\n\n"
        "Respond as JSON:\n"
        '{"code": "<complete code>", "explanation": "<brief explanation>"}'
    )


# ── Chat ──────────────────────────────────────────────────────────────────────

def chat_system(context: str = "") -> str:
    ctx = f"\n\nCurrent file context:\n{_truncate(context)}" if context else ""
    return SYSTEM_BASE + ctx
