const vscode = require("vscode");

const os = require("node:os");

function getPlatform() {
	const platform = os.platform();
	if (platform === "darwin") {
		return "mac";
	} else if (platform === "linux") {
		return "linux";
	} else if (platform === "win32") {
		return "windows";
	} else {
		return "unknown";
	}
}

function getMetaKeyName() {
	const platform = getPlatform();
	switch (platform) {
		case "mac":
			return "⌘";
		case "linux":
		case "windows":
			return "Ctrl";
		default:
			return "Ctrl";
	}
}
// contentText: `💬 Add to CodeGPT Chat (${getMetaKeyName()} + Shift + E).`,
const inlineTipDecoration = vscode.window.createTextEditorDecorationType({
	after: {
		contentIconPath: "${lightbulb-sparkle}",
		contentText: "",
		color: "var(--vscode-editorInlayHint-foreground)",
		backgroundColor: "var(--vscode-editorInlayHint-background)",
		margin: "0 0 0 1em",
		fontWeight: "normal",
	},
});

function showInlineTip() {
	return true;
}

function handleSelectionChange(e) {
	const selection = e.selections[0];
	const editor = e.textEditor;

	if (editor.document.uri.toString().startsWith("output:")) {
		return;
	}

	if (selection.isEmpty || showInlineTip() === false) {
		editor.setDecorations(inlineTipDecoration, []);
		return;
	}

	const line = Math.max(0, selection.start.line - 1);

	editor.setDecorations(inlineTipDecoration, [
		{
			range: new vscode.Range(
				new vscode.Position(line, Number.MAX_VALUE),
				new vscode.Position(line, Number.MAX_VALUE)
			),
		},
	]);
}

const emptyFileTooltipDecoration = vscode.window.createTextEditorDecorationType(
	{
		after: {
			contentText: `Use ${getMetaKeyName()}+I to generate code`,
			color: "#888",
			margin: "2em 0 0 0",
			fontStyle: "italic",
		},
	}
);

let selectionChangeDebounceTimer;
function setupInlineTips(context) {
	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection((e) => {
			if (selectionChangeDebounceTimer) {
				clearTimeout(selectionChangeDebounceTimer);
			}
			selectionChangeDebounceTimer = setTimeout(() => {
				handleSelectionChange(e);
			}, 200);
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor?.document.getText() === "" && showInlineTip() === true) {
				if (
					editor.document.uri.toString().startsWith("output:") ||
					editor.document.uri.scheme === "comment"
				) {
					return;
				}

				editor.setDecorations(emptyFileTooltipDecoration, [
					{
						range: new vscode.Range(
							new vscode.Position(0, Number.MAX_VALUE),
							new vscode.Position(0, Number.MAX_VALUE)
						),
					},
				]);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((e) => {
			if (e.document.uri.toString().startsWith("vscode://inline-chat")) {
				return;
			}
			if (e.document.getText() === "" && showInlineTip() === true) {
				vscode.window.visibleTextEditors.forEach((editor) => {
					editor.setDecorations(emptyFileTooltipDecoration, [
						{
							range: new vscode.Range(
								new vscode.Position(0, Number.MAX_VALUE),
								new vscode.Position(0, Number.MAX_VALUE)
							),
						},
					]);
				});
			} else {
				vscode.window.visibleTextEditors.forEach((editor) => {
					editor.setDecorations(emptyFileTooltipDecoration, []);
				});
			}
		})
	);
}

module.exports = { setupInlineTips, getMetaKeyName };


function sum