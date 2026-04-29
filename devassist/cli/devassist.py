#!/usr/bin/env python3
"""DevAssist CLI — AI-powered developer assistant"""

import sys
import uuid
import json
import argparse
from pathlib import Path

import httpx
from rich.console import Console
from rich.syntax import Syntax
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table
from rich import print as rprint

BASE_URL = "http://localhost:8000/api/v1"
console = Console()
SESSION_ID = str(uuid.uuid4())


def _read_file(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        console.print(f"[red]File not found: {path}[/red]")
        sys.exit(1)
    ext_map = {".py": "python", ".js": "javascript", ".ts": "typescript",
               ".cpp": "cpp", ".go": "go", ".rs": "rust", ".java": "java"}
    lang = ext_map.get(p.suffix, "auto")
    return {"content": p.read_text(), "language": lang, "filename": p.name}


def _post(endpoint: str, payload: dict) -> dict:
    try:
        r = httpx.post(f"{BASE_URL}/{endpoint}", json=payload, timeout=120)
        r.raise_for_status()
        return r.json()
    except httpx.ConnectError:
        console.print("[red]Cannot connect to DevAssist backend. Is it running?[/red]")
        console.print("  Run: [bold]uvicorn main:app --reload[/bold] in the backend/ directory")
        sys.exit(1)
    except httpx.HTTPStatusError as e:
        console.print(f"[red]API error {e.response.status_code}:[/red] {e.response.text}")
        sys.exit(1)


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_explain(args):
    if args.file:
        ctx = _read_file(args.file)
        code = ctx["content"]
        lang = ctx["language"]
    else:
        console.print("[yellow]Paste code (end with EOF / Ctrl+D):[/yellow]")
        code = sys.stdin.read()
        lang = args.lang or "auto"

    console.print(Panel("[bold cyan]Explaining code...[/bold cyan]", expand=False))
    data = _post("explain", {"code": code, "language": lang, "detail_level": args.detail})
    console.print(Markdown(data["explanation"]))
    console.print(f"\n[dim]⏱ {data['latency_ms']}ms[/dim]")


def cmd_bugfix(args):
    ctx = _read_file(args.file)
    console.print(Panel(f"[bold red]Scanning {ctx['filename']} for bugs...[/bold red]", expand=False))
    data = _post("bugfix", {"code": ctx["content"], "language": ctx["language"],
                             "file_context": ctx})

    if not data["bugs"]:
        console.print("[green]✓ No bugs found![/green]")
    else:
        t = Table(title="Bugs Found", show_lines=True)
        t.add_column("Line", style="cyan", width=6)
        t.add_column("Type", style="red", width=12)
        t.add_column("Description")
        t.add_column("Fix", style="green")
        for b in data["bugs"]:
            t.add_row(str(b.get("line") or "?"), b["type"], b["description"], b["fix"])
        console.print(t)

    console.print(Panel("[bold green]Fixed Code:[/bold green]", expand=False))
    console.print(Syntax(data["fixed_code"], ctx["language"], theme="monokai", line_numbers=True))

    if args.write:
        Path(args.file).write_text(data["fixed_code"])
        console.print(f"[green]✓ Written to {args.file}[/green]")

    console.print(f"\n[dim]⏱ {data['latency_ms']}ms[/dim]")


def cmd_refactor(args):
    ctx = _read_file(args.file)
    goals = args.goals.split(",") if args.goals else ["readability"]
    console.print(Panel(f"[bold magenta]Refactoring {ctx['filename']}...[/bold magenta]", expand=False))
    data = _post("refactor", {"code": ctx["content"], "language": ctx["language"], "goals": goals})

    console.print("[bold]Changes:[/bold]")
    for c in data["changes"]:
        console.print(f"  • {c}")

    console.print(Panel("[bold magenta]Refactored Code:[/bold magenta]", expand=False))
    console.print(Syntax(data["refactored_code"], ctx["language"], theme="monokai", line_numbers=True))

    if args.write:
        Path(args.file).write_text(data["refactored_code"])
        console.print(f"[green]✓ Written to {args.file}[/green]")

    console.print(f"\n[dim]⏱ {data['latency_ms']}ms[/dim]")


def cmd_generate(args):
    ctx = _read_file(args.context) if args.context else None
    payload = {"prompt": args.prompt, "language": args.lang}
    if ctx:
        payload["file_context"] = ctx
    console.print(Panel("[bold blue]Generating code...[/bold blue]", expand=False))
    data = _post("generate", payload)
    console.print(Syntax(data["code"], args.lang, theme="monokai", line_numbers=True))
    if data["explanation"]:
        console.print(f"\n[dim]{data['explanation']}[/dim]")
    console.print(f"\n[dim]⏱ {data['latency_ms']}ms[/dim]")


def cmd_chat(args):
    console.print(Panel(
        "[bold green]DevAssist Chat[/bold green] — type [bold]exit[/bold] to quit",
        expand=False
    ))
    ctx = _read_file(args.context) if args.context else None

    while True:
        try:
            user_input = console.input("[bold cyan]You:[/bold cyan] ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not user_input or user_input.lower() in ("exit", "quit"):
            break

        payload = {"session_id": SESSION_ID, "message": user_input}
        if ctx:
            payload["file_context"] = ctx

        data = _post("chat", payload)
        console.print(f"[bold green]DevAssist:[/bold green] ", end="")
        console.print(Markdown(data["reply"]))
        console.print(f"[dim]⏱ {data['latency_ms']}ms[/dim]\n")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(prog="devassist", description="AI-powered developer assistant")
    sub = parser.add_subparsers(dest="command", required=True)

    # explain
    p_explain = sub.add_parser("explain", help="Explain code")
    p_explain.add_argument("--file", "-f", help="Source file")
    p_explain.add_argument("--lang", "-l", default="auto")
    p_explain.add_argument("--detail", choices=["brief", "detailed"], default="detailed")

    # bugfix
    p_bug = sub.add_parser("bugfix", help="Detect and fix bugs")
    p_bug.add_argument("file", help="Source file")
    p_bug.add_argument("--write", "-w", action="store_true", help="Write fixed code back")

    # refactor
    p_ref = sub.add_parser("refactor", help="Refactor code")
    p_ref.add_argument("file", help="Source file")
    p_ref.add_argument("--goals", "-g", help="readability,performance,security,dry")
    p_ref.add_argument("--write", "-w", action="store_true", help="Write refactored code back")

    # generate
    p_gen = sub.add_parser("generate", help="Generate code from prompt")
    p_gen.add_argument("prompt", help="What to generate")
    p_gen.add_argument("--lang", "-l", default="python")
    p_gen.add_argument("--context", "-c", help="File for context")

    # chat
    p_chat = sub.add_parser("chat", help="Chat with DevAssist")
    p_chat.add_argument("--context", "-c", help="File for context")

    args = parser.parse_args()
    handlers = {
        "explain": cmd_explain,
        "bugfix": cmd_bugfix,
        "refactor": cmd_refactor,
        "generate": cmd_generate,
        "chat": cmd_chat,
    }
    handlers[args.command](args)


if __name__ == "__main__":
    main()
