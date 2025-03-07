const { InlineCompletionItem, Range } = require("vscode");

const { inspect } = require("util");
const vscode = require("vscode");
const { sendEvent } = require("./utils/telemetry");
const axios = require('axios')
const { getDistinctId,
	getSession
} = require('./utils/distinctId')

let nextjsPort = 54113;
let timerId;
let currentCancelToken = axios.CancelToken.source();
let hasClosedWarning = false;
 

console.debug = () => {};

function getIndexSuffix (text, prompt) {
	const firstSuffixLine = prompt.suffix.split('\n')[0]
	const leadingSpaces = firstSuffixLine.match(/^\s*/) ?? ['']
	let indexSuffix = -1

	if (prompt.suffix) {
		// Check if the first part of the choiceText matches the first suffix line
		if (!/^[\t\n]/.test(prompt.suffix)) {
			// Start from the right, until leading spaces are reached
			for (let i = firstSuffixLine.length; i > leadingSpaces[0].length; i--) {
				indexSuffix = text.indexOf(firstSuffixLine.slice(0, i))
				// If a match is found, return the index
				if (indexSuffix >= 0) {
					return indexSuffix
				}
			}
		}
	}
	return indexSuffix
}

class CodeGPTCopilotProvider {
	log;
	requestStatus = "done";
	statusBar;
	currentRequestId = 0;

	constructor(statusBar, logger, context) {
		this.statusBar = statusBar;
		this.log = logger;
		this.context = context;
		this.lastDocumentText = '';
		this.lastCompletion = [];
		this.lastCompletionStartPosition = null;
		this.userTypedText = '';
		this.lastCompletionTranslation = -1;
		this.lastProvider = '';
	}

	// @ts-ignore
	// because ASYNC and PROMISE
	async provideInlineCompletionItems(document, position) {
		this.currentRequestId += 1
		const requestId = this.currentRequestId;

		if (!await this.context.globalState.get(`autocompleteEnabled`)) {
			this.log("Extension not enabled, skipping.");
			return Promise.resolve([]);
		}
		const documentText = document.getText()
		const cursorPosition = document.offsetAt(position);

		if (this.lastDocumentText === documentText) {
			this.log("Document text is the same, skipping.");
			return Promise.resolve(this.lastCompletion ? this.lastCompletion : []);
		}

		this.lastDocumentText = documentText


		// Calculate typed text since last completion was provided
		if (this.lastCompletionStartPosition && this.lastCompletion.length > 0) {
			const typedText = documentText.slice(this.lastCompletionStartPosition, cursorPosition);

			const insertedText = this.lastCompletion[0].insertText;
			if (typedText && insertedText.startsWith(typedText)) {
				this.userTypedText = typedText;

				// Calculate the remaining text that hasn't been typed yet
				const remainingText = insertedText.slice(typedText.length);

				const actualChar = typedText.slice(-1)
				const nextChar = documentText.slice(this.lastCompletionStartPosition + typedText.length, cursorPosition + 1);
				if (['\'', '`', '"', '}', ']', ')'].includes(nextChar) && ['\'', '`', '"', '{', '[', '('].includes(actualChar)) {
					const indexSuffix = getIndexSuffix(remainingText, { suffix: nextChar})
					// If the first part of text matches the first suffix line
					if (indexSuffix >= 0) {
						// translate the position according to that index
						this.lastCompletionTranslation = remainingText.length - indexSuffix;
					}
				}

				if (remainingText) {
					let newPosition = this.lastCompletionTranslation > 0 ? position.translate(0, this.lastCompletionTranslation ) : position;
					const range = new vscode.Range(position, newPosition);
					const newCompletion = new vscode.InlineCompletionItem(
						remainingText,
						range,
						{
							title: 'CodeGPT.onCompletionAccepted',
							command: 'codegpt.onCompletionAccepted',
							arguments: [remainingText, true, this.lastAutocompleteId]
						}
					)

					// Return the new completion item
					return Promise.resolve([newCompletion]);
				}
			}
		}

		// Reset lastCompletion for the new request
		this.lastCompletion = [];
		this.lastCompletionStartPosition = cursorPosition;
		this.lastCompletionTranslation = -1;

		if (timerId) {
			clearTimeout(timerId);
		}

		const delay = 5; //await this.context.globalState.get(`autocompleteSuggestionDelay`);

		return new Promise((resolve) => {
			timerId = setTimeout(async () => {
				if (requestId !== this.currentRequestId) return resolve([]);

				// Autocomplete for commits
				let isSCM = document.languageId === 'scminput'

				const language = vscode.env.language

				this.requestStatus = "pending";
				this.statusBar.text = "$(codegpt-logotype) $(loading~spin)";
				this.statusBar.tooltip = "CodeGPT-Copilot - Working";
				let completionProvider = ''

				try {
					const response = await fetch(`http://localhost:54112/${nextjsPort}/api/autocomplete`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							text: documentText,
							positionLine: position.line,
							positionChar: position.character,
							fileName: document.fileName.split("/").pop(),
							language: document.languageId,
							workspacePath: vscode.workspace.workspaceFolders?.[0].uri.path ?? '.',
							isSCM
						}),
					});

					const {text, indexSuffix, autocompleteId, model, provider, error} = await response.json()
					// const autocompleteProvider = await context.globalState.get(`autocompleteProvider`)
					// const autocompleteModel = await context.globalState.get(`autocompleteModel`)
					// update model and provider
					this.context.globalState.update(`autocompleteProvider`, provider)
					this.context.globalState.update(`autocompleteModel`, model)

					completionProvider = provider
					if (this.lastProvider !== provider) hasClosedWarning = false
					this.lastProvider = provider
					
					this.log(`completion provider = ${completionProvider} | model = ${model}`);

					if (error) {
						if (error.includes('Ollama aborted by the user')) return resolve([])
						throw Error(error)
					}

					this.log(`${inspect({text}, false, null)}`)

					if (text) {
						let replaceRange = new Range(position, position);
						let lastCompletionTranslation = 0
						if (indexSuffix >= 0) {
							// translate the position according to that index
							lastCompletionTranslation = text.length - indexSuffix;
							replaceRange = new Range(position, position.translate(0, lastCompletionTranslation));
						}
						const completion = [
							new InlineCompletionItem(text, replaceRange, {
								title: 'CodeGPT.onCompletionAccepted',
								command: 'codegpt.onCompletionAccepted',
								arguments: [text, true, autocompleteId]
							})
						]
						if (requestId === this.currentRequestId) {
							resolve(completion);
							this.lastCompletion = completion
							this.lastCompletionTranslation = lastCompletionTranslation
							await this.sendEventWithStatusCode({
								statusCode: 200,
								completionProvider,
								model,
								language,
								autocompleteId,
								codeLinesNumber: text.split('\n').length
							});
						} else {
							resolve([])
						}
					}
					this.statusBar.text = '$(codegpt-logotype)'
					this.statusBar.tooltip = "CodeGPT-Copilot - Ready";
				} catch (error) {
					if (error.message.includes('Request timed out') && completionProvider == 'Ollama') {
						// Close on timeout for Ollama since this could be related to loading the model
						return resolve([])
					}
					let tooltipMessage = ''
					switch (completionProvider) {
						case "Ollama":
							tooltipMessage = "Make sure the Ollama URL is set correctly"
							break
						case "Mistral":
							tooltipMessage = "Make sure the Mistral API Key is set correctly"
							break
						default:
							tooltipMessage = "Something went wrong"
							break
					}
					if (error.message === 'Invalid access token') tooltipMessage = 'You must log in to use CodeGPT Plus as provider'
					if (error.message.includes('try pulling it first')) {
						const modelRegex = /model\s+"([^"]+)"/;
						const match = error.message.match(modelRegex)
						if (match) {
							const model = match[1]
							tooltipMessage = `You must download the ${model} in Ollama first`
						} else {
							tooltipMessage = 'You must download the selected model in Ollama first'
						}
						
					}
					if (!hasClosedWarning) vscode.window.showWarningMessage(`CodeGPT-Copilot - ${tooltipMessage}`)
					hasClosedWarning = true
					this.log(`${error.message}: ${tooltipMessage}`)
					this.statusBar.text = "$(codegpt-logotype) $(alert)"
					this.statusBar.tooltip = `CodeGPT-Copilot - ${tooltipMessage}`
					resolve([])
				} finally {
					this.requestStatus = "done";
				}
			}, delay);
		});
	}

	sleep(milliseconds) {
		// eslint-disable-next-line promise/param-names
		return new Promise((r) => setTimeout(r, milliseconds));
	}

	async sendEventWithStatusCode({
		statusCode,
		completionProvider,
		autocompleteId,
		model,
		language,
		codeLinesNumber
	}) {
		const codeGPTVersion = this.context.extension.packageJSON.version;
		const codeGPTUserId = await getDistinctId()
		const codeLanguage = vscode.window.activeTextEditor.document.languageId

		let accessToken
		try {
			const session = await getSession()
			accessToken = JSON.parse(session)?.accessToken

		} catch {
		}

		const mixPanelData = {
			userType: !accessToken ? 'anonymous' : 'registered',
			provider: completionProvider,
			model,
			codeLinesNumber,
			autocompleteId,
			language,
			codeLanguage,
			codeGPTVersion,
		};

		const signedDistinctId = await getSession().then(session => session?.signedDistinctId)
		const fullData = {
			...mixPanelData,
			statusCode,
		};
		sendEvent("Autocomplete", fullData, codeGPTUserId, accessToken, signedDistinctId);
	}
}


module.exports = CodeGPTCopilotProvider;