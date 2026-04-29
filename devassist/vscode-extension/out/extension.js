"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
let sessionId = Math.random().toString(36).slice(2);
function getBackendUrl() {
    return vscode.workspace.getConfiguration("devassist").get("backendUrl", "http://localhost:8000");
}
async function post(endpoint, payload) {
    const url = `${getBackendUrl()}/api/v1/${endpoint}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`DevAssist API error: ${response.status} ${await response.text()}`);
    }
    return response.json();
}
function getFileContext(editor) {
    const langMap = {
        python: "python", javascript: "javascript", typescript: "typescript",
        cpp: "cpp", java: "java", go: "go", rust: "rust",
    };
    return {
        content: editor.document.getText(),
        language: langMap[editor.document.languageId] ?? "auto",
        filename: editor.document.fileName.split("/").pop(),
    };
}
// ── Autocomplete Provider ─────────────────────────────────────────────────────
class DevAssistCompletionProvider {
    async provideInlineCompletionItems(document, position, _context, token) {
        if (!vscode.workspace.getConfiguration("devassist").get("autocompleteEnabled", true))
            return;
        return new Promise((resolve) => {
            if (this.debounceTimer)
                clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                if (token.isCancellationRequested) {
                    resolve(undefined);
                    return;
                }
                const prefix = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
                const suffix = document.getText(new vscode.Range(position, document.lineAt(document.lineCount - 1).range.end));
                const fileContext = getFileContext(vscode.window.activeTextEditor);
                try {
                    const data = await post("autocomplete", {
                        prefix, suffix, file_context: fileContext, max_tokens: 128,
                    });
                    if (!data.completion || token.isCancellationRequested) {
                        resolve(undefined);
                        return;
                    }
                    resolve(new vscode.InlineCompletionList([
                        new vscode.InlineCompletionItem(data.completion, new vscode.Range(position, position)),
                    ]));
                }
                catch {
                    resolve(undefined);
                }
            }, 600);
        });
    }
}
// ── Webview Panel ─────────────────────────────────────────────────────────────
function createResultPanel(context, title, content, lang = "plaintext") {
    const panel = vscode.window.createWebviewPanel("devassist", `DevAssist: ${title}`, vscode.ViewColumn.Beside, {});
    panel.webview.html = `<!DOCTYPE html><html><head>
  <style>
    body { font-family: var(--vscode-editor-font-family); padding: 16px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    pre { background: var(--vscode-textBlockQuote-background); padding: 12px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; }
    h2 { color: var(--vscode-textLink-foreground); }
  </style></head><body>
  <h2>${title}</h2>
  <pre><code>${escapeHtml(content)}</code></pre>
  </body></html>`;
}
function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// ── Chat Webview ──────────────────────────────────────────────────────────────
function openChatPanel(context) {
    const panel = vscode.window.createWebviewPanel("devassistChat", "DevAssist Chat", vscode.ViewColumn.Beside, { enableScripts: true });
    panel.webview.html = getChatHtml();
    panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.type === "send") {
            const editor = vscode.window.activeTextEditor;
            const fileContext = editor ? getFileContext(editor) : undefined;
            try {
                const data = await post("chat", {
                    session_id: sessionId,
                    message: msg.text,
                    file_context: fileContext,
                });
                panel.webview.postMessage({ type: "reply", text: data.reply, latency: data.latency_ms });
            }
            catch (e) {
                panel.webview.postMessage({ type: "error", text: e.message });
            }
        }
    }, undefined, context.subscriptions);
}
function getChatHtml() {
    return `<!DOCTYPE html><html><head>
  <style>
    * { box-sizing: border-box; }
    body { font-family: var(--vscode-editor-font-family); background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); margin: 0; display: flex; flex-direction: column; height: 100vh; }
    #messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .msg { padding: 8px 12px; border-radius: 8px; max-width: 90%; white-space: pre-wrap; }
    .user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); align-self: flex-end; }
    .assistant { background: var(--vscode-textBlockQuote-background); align-self: flex-start; }
    .error { background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); }
    #input-row { display: flex; padding: 8px; gap: 8px; border-top: 1px solid var(--vscode-panel-border); }
    #input { flex: 1; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; resize: none; font-family: inherit; }
    button { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
    .latency { font-size: 0.7em; opacity: 0.5; margin-top: 2px; }
  </style></head><body>
  <div id="messages"><div class="msg assistant">👋 Hi! I'm DevAssist. Ask me anything about your code.</div></div>
  <div id="input-row">
    <textarea id="input" rows="2" placeholder="Ask DevAssist..."></textarea>
    <button onclick="send()">Send</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const msgs = document.getElementById('messages');
    const input = document.getElementById('input');

    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMsg(text, 'user');
      vscode.postMessage({ type: 'send', text });
      input.value = '';
    }

    function addMsg(text, cls, latency) {
      const d = document.createElement('div');
      d.className = 'msg ' + cls;
      d.textContent = text;
      if (latency) {
        const l = document.createElement('div');
        l.className = 'latency';
        l.textContent = latency + 'ms';
        d.appendChild(l);
      }
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    window.addEventListener('message', e => {
      const m = e.data;
      if (m.type === 'reply') addMsg(m.text, 'assistant', m.latency);
      else if (m.type === 'error') addMsg('Error: ' + m.text, 'error');
    });
  </script></body></html>`;
}
// ── Extension Activate ────────────────────────────────────────────────────────
function activate(context) {
    // Register inline completion
    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, new DevAssistCompletionProvider()));
    // Explain
    context.subscriptions.push(vscode.commands.registerCommand("devassist.explain", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const code = editor.document.getText(editor.selection.isEmpty ? undefined : editor.selection);
        const lang = getFileContext(editor).language;
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "DevAssist: Explaining..." }, async () => {
            try {
                const data = await post("explain", { code, language: lang });
                createResultPanel(context, "Explanation", data.explanation);
            }
            catch (e) {
                vscode.window.showErrorMessage(e.message);
            }
        });
    }));
    // Bugfix
    context.subscriptions.push(vscode.commands.registerCommand("devassist.bugfix", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const fileContext = getFileContext(editor);
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "DevAssist: Scanning for bugs..." }, async () => {
            try {
                const data = await post("bugfix", {
                    code: fileContext.content, language: fileContext.language, file_context: fileContext
                });
                const report = data.bugs.length === 0
                    ? "✓ No bugs found!"
                    : data.bugs.map((b) => `[Line ${b.line ?? "?"}] ${b.type}: ${b.description}\nFix: ${b.fix}`).join("\n\n")
                        + "\n\n--- FIXED CODE ---\n" + data.fixed_code;
                createResultPanel(context, "Bug Report", report);
                if (data.bugs.length > 0) {
                    const apply = await vscode.window.showInformationMessage(`Found ${data.bugs.length} bug(s). Apply fixes?`, "Apply", "Dismiss");
                    if (apply === "Apply") {
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), data.fixed_code);
                        await vscode.workspace.applyEdit(edit);
                    }
                }
            }
            catch (e) {
                vscode.window.showErrorMessage(e.message);
            }
        });
    }));
    // Refactor
    context.subscriptions.push(vscode.commands.registerCommand("devassist.refactor", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const code = editor.document.getText(editor.selection.isEmpty ? undefined : editor.selection);
        const lang = getFileContext(editor).language;
        const goals = await vscode.window.showQuickPick(["readability", "performance", "security", "dry"], { canPickMany: true, placeHolder: "Select refactor goals" });
        if (!goals?.length)
            return;
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "DevAssist: Refactoring..." }, async () => {
            try {
                const data = await post("refactor", {
                    code, language: lang, goals,
                });
                createResultPanel(context, "Refactored Code", data.changes.join("\n") + "\n\n" + data.refactored_code);
                const apply = await vscode.window.showInformationMessage("Apply refactored code?", "Apply", "Dismiss");
                if (apply === "Apply") {
                    const edit = new vscode.WorkspaceEdit();
                    const range = editor.selection.isEmpty
                        ? new vscode.Range(0, 0, editor.document.lineCount, 0)
                        : editor.selection;
                    edit.replace(editor.document.uri, range, data.refactored_code);
                    await vscode.workspace.applyEdit(edit);
                }
            }
            catch (e) {
                vscode.window.showErrorMessage(e.message);
            }
        });
    }));
    // Generate
    context.subscriptions.push(vscode.commands.registerCommand("devassist.generate", async () => {
        const prompt = await vscode.window.showInputBox({ prompt: "Describe what to generate" });
        if (!prompt)
            return;
        const editor = vscode.window.activeTextEditor;
        const fileContext = editor ? getFileContext(editor) : undefined;
        const lang = fileContext?.language ?? "python";
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "DevAssist: Generating..." }, async () => {
            try {
                const data = await post("generate", {
                    prompt, language: lang, file_context: fileContext,
                });
                if (editor) {
                    const edit = new vscode.WorkspaceEdit();
                    edit.insert(editor.document.uri, editor.selection.active, "\n" + data.code + "\n");
                    await vscode.workspace.applyEdit(edit);
                }
                createResultPanel(context, "Generated Code", data.explanation + "\n\n" + data.code);
            }
            catch (e) {
                vscode.window.showErrorMessage(e.message);
            }
        });
    }));
    // Chat
    context.subscriptions.push(vscode.commands.registerCommand("devassist.chat", () => {
        openChatPanel(context);
    }));
    vscode.window.showInformationMessage("DevAssist activated! Inline completions enabled.");
}
function deactivate() { }
//# sourceMappingURL=extension.js.map