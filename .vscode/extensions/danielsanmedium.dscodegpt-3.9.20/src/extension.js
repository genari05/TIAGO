const vscode = require('vscode')
const language = require('./utils/language.js')
const ChatSidebarProvider = require('./ChatSidebarProvider')
const fs = require('fs')
const tar = require('tar')
const fsPromises = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { sendEvent } = require('./utils/telemetry.js')
const ConfigurationManager = require('./internal/ConfigManager')
const createLogger = require('./internal/logger')
const { extensionName } = require('./internal/constants')
const CodeGPTCopilotProvider = require('./CodeGPTCopilotProvider')
const polka = require('polka')
const log = createLogger(vscode.window.createOutputChannel(extensionName))
const { json } = require('body-parser')
const isUUID = require('./utils/isUUID')
const nodeFetch = require('node-fetch')
const isBinaryFile = require('isbinaryfile').isBinaryFile

const fetch = async (url, options) => {
  try {
    return await nodeFetch(url, options)
  } catch (error) {
    console.error('Error al realizar la solicitud:', error)
    throw error
  }
}

const { openExternalView } = require('./utils/nextjs_webview.js')
let nextjsPort = 54113
const portfinder = require('portfinder')
const { getDistinctId, getSession } = require('./utils/distinctId')
const ignore = require('ignore')

const hasWorkspace = vscode.workspace.workspaceFolders !== undefined
let provider = hasWorkspace ? getConfig({ config: 'CodeGPT.apiKey' }) : 'CodeGPT Plus Beta'

function getConfig({ config, defaultValue = '' }) {
  return vscode.workspace.getConfiguration().get(config) || defaultValue
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

let syncProvider

const syncProviderHOF = (context) => {
  return debounce((provider) => {
    const chatSidebarProvider = ChatSidebarProvider.getChatInstance(context)
    chatSidebarProvider.view.webview.postMessage({
      type: 'syncProvider',
      value: provider,
      ok: true
    })
  }, 300) // 300ms de espera
}

let autoSelectSend
const autoSelectSendHOF = (context) => {
  return async () => {
    const isAutoSelect = Boolean(await context.globalState.get('autoSelect'))
    const editor = vscode.window.activeTextEditor
    if (editor) {
      const document = editor.document
      const selectedText = document.getText(editor.selection)
      const fullText = document.getText()
      const fromLine = Math.min(editor.selection.start.line, editor.selection.end.line)
      const toLine = Math.max(editor.selection.start.line, editor.selection.end.line) + 1

      const sendMsg = (canRepeat = true) => {
        try {
          const chatSidebarProvider = ChatSidebarProvider.getChatInstance(context)
          chatSidebarProvider.view.webview.postMessage({
            type: 'selectionCodeGPT',
            ok: true,
            selectedText: selectedText || (isAutoSelect ? fullText : ''),
            fileName: document.fileName.split('/').pop().split('.')[0],
            language: document.languageId,
            from: selectedText
              ? new vscode.Position(fromLine, editor.selection.start.character)
              : null,
            to: selectedText ? new vscode.Position(toLine, editor.selection.end.character) : null,
            lines: document.lineCount,
            lineAt: document.lineAt(editor.selection.active)
          })
        } catch {
          if (canRepeat) {
            setTimeout(() => {
              sendMsg(false)
            }, 10000)
          }
        }
      }
      sendMsg()
    }
  }
}

const selectAllCommand = async () => {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const document = editor.document
  const lastLine = document.lineCount - 1
  const lastChar = document.lineAt(lastLine).text.length

  editor.selection = new vscode.Selection(0, 0, lastLine, lastChar)
}

/*
async function applyCode(code) {

const editor = vscode.window.activeTextEditor;
if (!editor) {
  return;
}

const startPosition = new vscode.Position(0, 0);
editor.revealRange(new vscode.Range(startPosition, startPosition), vscode.TextEditorRevealType.AtTop);

await selectAllCommand()

const selection = editor.selection;
const selectedText = editor.document.getText(selection);

// First, update the text in the editor
await editor.edit(editBuilder => {
  editBuilder.replace(selection, code);
});

const newLines = code.split('\n').length - 1
const lastLineLength = code.split('\n').pop().length

let newSelection = new vscode.Selection(selection.start, selection.start.translate(newLines, lastLineLength));
editor.selection = newSelection;

await vscode.commands.executeCommand('editor.action.formatDocument');

newSelection = editor.selection

const newSelectionText = editor.document.getText(newSelection);

const { updatedText, decorations, lines } = getDiff(editor, selectedText, newSelectionText, newSelection);

await editor.edit(editBuilder => {
  editBuilder.replace(newSelection, selectedText);
});

newSelection = editor.selection

const codeLensProvider = new DiffCodeLensProvider();
codeLensProvider.setDecorationRange(newSelection);
const codeLensDisposable = vscode.languages.registerCodeLensProvider('*', codeLensProvider);

// Save decorations globally and the CodeLens disposable.
globalDecorations = decorations;
globalSelection = newSelection;
globalCodeLensProvider = codeLensProvider;
globalCodeLensDisposable = codeLensDisposable;
globalLines = lines; // Save lines globally

await applyUpdatedTextAndDecorations(editor, updatedText, decorations, newSelection);
}
*/

const vscodeDriver = async (context) => {
  const app = polka()

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })

  app.use(json())

  app.post('/showErrorMessage', async (req, res) => {
    const { message } = req.body
    // vscode.window.showErrorMessage(message);
    notify(message, 'error')
    res.end()
  })

  app.post('/showWarningMessage', async (req, res) => {
    const { message } = req.body
    vscode.window.showWarningMessage(message)
    res.end()
  })

  app.post('/showInformationMessage', async (req, res) => {
    const { message } = req.body
    vscode.window.showInformationMessage(message)
    res.end()
  })

  app.post('/executeCommand', async (req, res) => {
    const { command } = req.body
    vscode.commands.executeCommand(command)
    res.end()
  })

  app.get('/language', async (req, res) => {
    const { activeTextEditor } = vscode.window
    if (activeTextEditor) {
      const { document } = activeTextEditor
      const { languageId } = document
      res.end(languageId)
    } else {
      res.end('')
    }
  })

  app.get('/filename', async (req, res) => {
    const { activeTextEditor } = vscode.window
    if (activeTextEditor) {
      const { document } = activeTextEditor
      const { fileName } = document
      res.end(fileName.split('/').pop())
    } else {
      res.end('')
    }
  })

  app.get('/isAnonymous', async (req, res) => {
    let isAnonymous = true
    try {
      const session = await getSession()
      const accessToken = JSON.parse(session)?.accessToken
      if (accessToken) {
        isAnonymous = false
      }
    } catch (e) {
      isAnonymous = true
    }
    res.end(isAnonymous.toString())
  })

  app.get('/ideLanguage', async (req, res) => {
    const language = vscode.env.language
    const localesMap = {
      en: 'English',
      'zh-cn': 'Simplified_Chinese',
      'zh-tw': 'Traditional_Chinese',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      es: 'Spanish',
      ja: 'Japanese',
      ko: 'Korean',
      ru: 'Russian',
      'pt-br': 'Portuguese',
      tr: 'Turkish',
      pl: 'Polish',
      cs: 'Czech',
      hu: 'Hungarian'
    }
    res.end(localesMap[language] ?? 'English')
  })

  app.post('/insertCode', async (req, res) => {
    const { code } = req.body
    const { activeTextEditor } = vscode.window
    // console.log({ activeTextEditor })
    if (activeTextEditor) {
      const { selection } = activeTextEditor
      activeTextEditor.edit((editBuilder) => {
        editBuilder.replace(selection, code)
      })
    }
    vscode.commands.executeCommand('editor.action.format')
    res.end()
  })

  app.post('/insertCodeInTerminal', async (req, res) => {
    const { code } = req.body
    let terminal = vscode.window.activeTerminal
    if (!terminal) {
      terminal = vscode.window.createTerminal()
    }
    terminal.show()
    terminal.sendText(code.trimEnd(), false)
    res.end()
  })

  app.post('/newFileWithCode', async (req, res) => {
    const { code } = req.body
    const newDocument = await vscode.workspace.openTextDocument({
      content: '',
      language: ''
    })
    await vscode.window.showTextDocument(newDocument)
    const { activeTextEditor } = vscode.window
    if (activeTextEditor) {
      const { selection } = activeTextEditor
      activeTextEditor.edit((editBuilder) => {
        editBuilder.replace(selection, code)
      })
    }
    res.end()
  })

  app.get('/getSelectedText', async (req, res) => {
    let selectedText = ''
    const { activeTextEditor } = vscode.window
    if (activeTextEditor) {
      const { document } = activeTextEditor

      const { selection } = activeTextEditor
      selectedText = document.getText(selection)
    } else {
      console.log('No active text editor found.')
    }
    res.end(selectedText)
  })

  app.get('/getSelectedText/full', async (req, res) => {
    console.log('getSelectedText/full')
    if (!vscode.window.activeTextEditor) {
      res.end(JSON.stringify({ ok: false, error: 'No active text editor.' }))
      console.log('No active text editor found.')
      return
    }
    const selection = vscode.window.activeTextEditor.selection
    const selectedText = vscode.window.activeTextEditor.document.getText(selection)
    const fullFileText = vscode.window.activeTextEditor.document.getText()
    const sendFullText = Boolean(selectedText)
    res.end(
      JSON.stringify({
        ok: true,
        selectedText: selectedText || fullFileText,
        fileName: vscode.window.activeTextEditor.document.fileName.split('/').pop().split('.')[0],
        language: vscode.window.activeTextEditor.document.languageId,
        ...(sendFullText
          ? {
              from: vscode.window.activeTextEditor.selection.start,
              to: vscode.window.activeTextEditor.selection.end,
              lines: vscode.window.activeTextEditor.document.lineCount,
              lineAt: vscode.window.activeTextEditor.document.lineAt(selection.active)
            }
          : {})
      })
    )
  })

  app.post('/secrets', async (req, res) => {
    const { key, value } = req.body
    await context.secrets.store(key, value)
    res.end()
  })

  app.delete('/secret/:id', async (req, res) => {
    const { id } = req.params
    await context.secrets.delete(id)
    res.end()
  })

  app.post('/globalState', async (req, res) => {
    const { key, value } = req.body
    await context.globalState.update(key, value)
    res.end()
  })

  app.delete('/globalState/:id', async (req, res) => {
    const { id } = req.params
    await context.globalState.update(id, '')
    res.end()
  })

  app.post('/config', async (req, res) => {
    const { key, value } = req.body
    console.log({
      key,
      value
    })
    if (hasWorkspace) {
      await vscode.workspace
        .getConfiguration()
        .update(key, value, vscode.ConfigurationTarget.Workspace)
    } else {
      if (key === 'CodeGPT.apiKey') {
        provider = value
      }
    }
    res.end()
  })

  app.post('/copy', async (req, res) => {
    const { code } = req.body
    vscode.env.clipboard.writeText(code)
    console.log('copied', code)
    res.end()
  })

  app.get('/paste', async (req, res) => {
    const code = await vscode.env.clipboard.readText()
    console.log('pasted', code)
    res.end(code)
  })

  app.post('/openUrl', async (req, res) => {
    const { url } = req.body
    vscode.env.openExternal(vscode.Uri.parse(url))
    res.end()
  })

  app.get('/version', async (req, res) => {
    const codeGPTVersion = context.extension.packageJSON.version
    res.end(codeGPTVersion)
  })

  // const autoComplete = {
  //   enabled: vscode.workspace.getConfiguration(pluginSection).get('enabled'), // enabled
  //   provider: vscode.workspace.getConfiguration(pluginSection).get('provider').split(' - ')[0].trim(), // provider
  //   model: vscode.workspace.getConfiguration(pluginSection).get('provider').split(' - ')[1].trim(), // model
  //   maxTokens: vscode.workspace.getConfiguration(pluginSection).get('maxTokens'), // maxTokens
  //   suggestionDelay: vscode.workspace.getConfiguration(pluginSection).get('suggestionDelay') // suggestionDelay
  // }

  app.post('/autocompleteEnabled', async (req, res) => {
    const { value } = req.body
    await context.globalState.update('autocompleteEnabled', value)
    res.end()
  })

  app.post('/model', async (req, res) => {
    const { model, fromMarketplace, provider } = req.body
    await context.globalState.update(`${provider}_model`, { model, fromMarketplace })
    console.log({ model, fromMarketplace, provider })
    res.end()
  })

  app.post('/openWebviewUrl', async (req, res) => {
    const { url } = req.body
    openExternalView(url)
    res.end()
  })

  app.post('/changeIframeUrl', async (req, res) => {
    const { url } = req.body
    console.log({ body: req.body })
    const chatSidebarProvider = ChatSidebarProvider.getChatInstance(context)
    chatSidebarProvider.changeUrl(url)
    res.end()
  })

  app.get('/getProjectStructure', async (req, res) => {
    const projectStructure = await getProjectStructure()

    if (!projectStructure || projectStructure.length === 0) {
      res.end(JSON.stringify({ ok: false, error: 'No project found.' }))
      return
    }

    res.end(JSON.stringify(projectStructure))
  })

  app.get('/workspaceFolder', async (req, res) => {
    const workspaceFolder = vscode?.workspace?.workspaceFolders?.[0]?.uri?.fsPath
    res.end(workspaceFolder ?? '')
  })

  app.get('/getFileContent', async (req, res) => {
    const { filePath, from, to } = req.query
    const fileContent = filePath
      ? await readFileContent(filePath, from, to)
      : vscode.window.activeTextEditor.document.getText()
    res.end(fileContent)
  })

  app.get('/cleanCache', async (req, res) => {
    console.log('reset cache')
    await context.globalState.update('resetCache', true)
    res.end()
  })

  app.get('/getAllPathsFromProject', async (req, res) => {
    const paths = await getAllPathsFromProject()
    res.end(JSON.stringify(paths))
  })

  app.post('/writeFileContent', async (req, res) => {
    const { filePath, content } = req.body
    const success = await writeFileContent(filePath, content)
    res.end(JSON.stringify({ success }))
  })

  app.post('/openFile', async (req, res) => {
    const { filePath, startLine, endLine } = req.body
    await openFile(filePath, startLine, endLine)
    res.end()
  })

  app.post('/autoSelect', async (req, res) => {
    const { enabled } = req.body
    await context.globalState.update('autoSelect', enabled)
    if (enabled) {
      autoSelectSend()
    }
    res.end(Boolean(enabled).toString())
  })

  app.get('/autoSelect', async (req, res) => {
    const enabled = await context.globalState.get('autoSelect')
    res.end(Boolean(enabled).toString())
  })

  app.get('/extensionVersion', async (req, res) => {
    const codeGPTVersion = context.extension.packageJSON.version
    res.end(codeGPTVersion)
  })

  app.get('/ghCopilot', async (req, res) => {
    const models = await vscode.lm.selectChatModels()
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(models))
  })

  app.post('/ghCopilot', async (req, res) => {
    const { messages, model, temperature } = req.body
    console.log({ messages, model })
    const models = await vscode.lm.selectChatModels({ family: model })
    const msg = await models[0].sendRequest(
      messages.map((message) => {
        if (message.role !== 'user') {
          return vscode.LanguageModelChatMessage.Assistant(message.content)
        } else {
          return vscode.LanguageModelChatMessage.User(message.content)
        }
      }),
      {
        modelOptions: {
          ...(temperature ? { temperature } : {})
        }
      }
    )
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')

    for await (const chunk of msg.text) {
      const structured = {
        choices: [
          {
            delta: {
              content: chunk
            }
          }
        ],
        created: Date.now(),
        model: model.id
      }

      res.write(`data: ${JSON.stringify(structured)}\n\n`)
    }
    res.write('[DONE]')
    res.end()
  })

  app.get('/distinctId', async (req, res) => {
    const codeGPTUserId = await context.globalState.get('codeGPTUserId') // uuid = logged in | codeGPTUserId = anonymous or logged in
    const validId = isUUID(codeGPTUserId)
    res.end(validId ? codeGPTUserId : '')
  })

  app.post('/applyCode', async (req, res) => {
    const { newCode, oldCode } = req.body
    const editor = vscode.window.activeTextEditor

    if (editor) {
      const document = editor.document
      const fullText = document.getText()
      const escapedOldCode = oldCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')
      const regex = new RegExp(escapedOldCode, 'g')
      const updatedText = fullText.replace(
        regex,
        `
			${newCode}`
      )

      const entireRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(fullText.length)
      )

      await editor.edit((editBuilder) => {
        editBuilder.replace(entireRange, updatedText)
      })

      // format code
      await vscode.commands.executeCommand('editor.action.formatDocument')

      res.end('ok')
    } else {
      res.status(400).send('No active editor')
    }
  })

  app.listen(nextjsPort, async (err) => {
    if (err) throw vscode.window.showErrorMessage(err)
    console.log(`extension driver > Running on localhost:${nextjsPort}`)
  })
}

const getPort = () => {
  return new Promise((resolve, reject) => {
    portfinder.getPort(
      {
        port: 54113,
        stopPort: 54500
      },
      (err, port) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          resolve(port)
        }
      }
    )
  })
}

async function isTextFile(filePath, numBytesToRead = 512) {
  try {
    const content = await readFileContent(filePath)
    const bytes = Buffer.from(content)

    if (bytes.length === 0) {
      return false
    }

    const bytesToCheck = bytes.slice(0, numBytesToRead)
    const printableChars = [...bytesToCheck].filter(
      (byte) => (byte >= 32 && byte <= 126) || [9, 10, 13].includes(byte)
    ).length

    // Consider it a text file if more than 95% of the characters are printable
    return printableChars / bytesToCheck.length >= 0.95
  } catch (err) {
    console.error(`Error checking if file is text: ${err}`)
    return false
  }
}

async function readDirectory(dirPath) {
  const dirStructure = {}
  const entries = await fsPromises.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      dirStructure[entry.name] = await readDirectory(fullPath) // Recursion for subdirectories
    } else {
      dirStructure[entry.name] = fullPath // Save file path
    }
  }

  return dirStructure
}

async function getProjectStructure() {
  const rootPath = vscode.workspace.rootPath

  if (!rootPath) {
    vscode.window.showInformationMessage('No project is currently open.')
    return
  }

  try {
    return await readDirectory(rootPath)
  } catch (err) {
    console.error('Error obtaining the project structure.', err)
    return null
  }
}

async function openFile(filePath, startLine, endLine) {
  let editor = await vscode.window.activeTextEditor
  console.log({ filePath, startLine, endLine })
  if (filePath) {
    const file = await vscode.workspace.openTextDocument(
      path.join(vscode.workspace.rootPath, filePath)
    )
    editor = await vscode.window.showTextDocument(file)
  }
  if (startLine && endLine) {
    const startPosition = new vscode.Position(startLine, 0)
    const endPosition = new vscode.Position(endLine, editor.document.lineAt(endLine).text.length)
    editor.selection = new vscode.Selection(startPosition, endPosition)
    editor.revealRange(new vscode.Range(startPosition, endPosition))
  }
}

async function readFileContent(filePath, from, to) {
  try {
    const fullPath = path.join(vscode.workspace.rootPath || '', filePath)
    const fileBuffer = await fsPromises.readFile(fullPath)

    // Verificar si el archivo es binario
    if (await isBinaryFile(fileBuffer, fileBuffer.length)) {
      return ''
    }

    const fileContent = fileBuffer.toString('utf8')

    if (from === undefined) {
      return fileContent
    }

    const lines = fileContent.split('\n')

    // Si `to` no está definido, leer hasta el final del archivo
    to = to !== null ? to : lines.length

    // Obtener las líneas especificadas
    return lines.slice(from, to).join('\n')
  } catch (err) {
    return ''
  }
}

async function formatClosedDocument(filePath) {
  // Abre el documento
  const document = await vscode.workspace.openTextDocument(filePath)
  // Muestra el documento en un nuevo editor
  await vscode.window.showTextDocument(document, { preview: false })
  // Ejecuta el comando de formateo
  await vscode.commands.executeCommand('editor.action.formatDocument')
  // Cierra el editor
  // await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
}

async function writeFileContent(filePath, content) {
  try {
    const fullPath = path.join(vscode.workspace.rootPath, filePath)
    const dir = path.dirname(fullPath)

    // Create directory if it doesn't exist
    await fsPromises.mkdir(dir, { recursive: true })

    // Check if file already exists
    try {
      await fsPromises.access(fullPath)
      await formatClosedDocument(fullPath)
      return false // File already exists
    } catch (err) {
      // File does not exist, proceed to write
      await fsPromises.writeFile(fullPath, content)
      await formatClosedDocument(fullPath)
      return true // File written successfully
    }
  } catch (err) {
    console.error('Error writing file:', err)
    return false // Error occurred
  }
}

const ignoreExtensions = [
  'eslintignore',
  'cjs',
  'npmrc',
  'prettierignore',
  'prettierrc',
  // "json",
  'mjs',
  // ignore images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'prettierrc',
  'webp',
  'bmp',
  'svg',
  'ico',
  // ignore media
  'mov',
  'mp4',
  'mp3',
  'wav',
  'flac',
  'wmv',
  'avi',
  'mkv',
  'webm',
  'mpg',
  'mpeg',
  'm4v',
  '3gp',
  '3g2',
  'flv',
  'ogg',
  'ogv',
  // ignore fonts
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot',
  'woff',
  'woff2',
  // ignore db
  'db',
  'sqlite',
  'sqlite3',
  'sqlite-journal',
  // ignore documents
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'rtf',
  'txt',
  // ignore archives
  'zip',
  'tar',
  'gz',
  'rar',
  '7z',
  'bz2',
  'xz',
  'lz',
  'lzma',
  'lzo',
  'z',
  'tgz',
  'tbz2',
  'txz',
  'tlz',
  // others
  'pem',
  'min.css',
  'min.css.map',
  'min.js',
  'min.js.map',
  'log',
  'lockb',
  '-lock.json',
  '-lock.yaml',
  'yarn.lock',
  'pnpm-lock.yaml',
  'pnpm-lock.yml',
  'bun.lockb',
  'bun.lock',
  'tsconfig.tsbuildinfo'
]

const getAllPathsFromProject = async () => {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    vscode.window.showInformationMessage('No workspace folders found.')
    return
  }

  const workspaceFolder = workspaceFolders[0].uri.fsPath
  let ig = ignore()

  const gitignorePath = path.join(workspaceFolder, '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const gitIgnoreContent = fs.readFileSync(gitignorePath, 'utf8')
    ig = ig.add(gitIgnoreContent)
  }
  const vscodeignorePath = path.join(workspaceFolder, '.vscodeignore')
  if (fs.existsSync(vscodeignorePath)) {
    const vscodeIgnoreContent = fs.readFileSync(vscodeignorePath, 'utf8')
    ig = ig.add(vscodeIgnoreContent)
  }

  const files = await vscode.workspace.findFiles('**/*')
  const filteredFiles = files.filter((file) => {
    const relativePath = path.relative(workspaceFolder, file.fsPath)
    const fileExtension = path.extname(relativePath).slice(1) // Obtener la extensión del archivo sin el punto inicial
    return (
      !ig.ignores(relativePath) && !ignoreExtensions.some((ending) => relativePath.endsWith(ending))
    )
  })
  if (filteredFiles.length === 0) {
    vscode.window.showInformationMessage('No files found in the workspace.')
    return
  }

  return filteredFiles.map((file) => `${path.relative(workspaceFolder, file.fsPath)}`)
}

const migrateToSqlite = async (context) => {
  // Migrar conexiones
  const providers =
    context.extension.packageJSON.contributes.configuration[0].properties['CodeGPT.apiKey'].enum

  console.log({ providers })

  for (const provider of providers) {
    // Migrar API Key
    const apiKey = await context.secrets.get(`API_KEY_${provider}`)
    if (apiKey) {
      const [
        organizationId,
        customLink,
        googleOauth,
        region,
        accessKeyId,
        secretAccessKey,
        sessionToken
      ] = await Promise.all([
        context.secrets.get(`${provider}_orgId`),
        context.secrets.get(`${provider}_customLink`),
        context.secrets.get('googleOauth'),
        context.secrets.get(`${provider}_region`),
        context.secrets.get(`${provider}_accessKeyId`),
        context.secrets.get(`${provider}_secretAccessKey`),
        context.secrets.get(`${provider}_sessionToken`)
      ])

      console.log('='.repeat(30))

      const payload = {
        provider,
        ...(apiKey ? { apikey: apiKey } : {}),
        ...(organizationId ? { organization_id: organizationId } : {}),
        ...(customLink ? { custom_link: customLink } : {}),
        ...(googleOauth && provider === 'Google' ? { google_Oauth: googleOauth } : {}),
        ...(region ? { region } : {}),
        ...(accessKeyId ? { access_key_id: accessKeyId } : {}),
        ...(secretAccessKey ? { secret_access_key: secretAccessKey } : {}),
        ...(sessionToken ? { session_token: sessionToken } : {})
      }

      await fetch('http://localhost:54112/api/migrate-sqlite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'connection',
          ...payload
        })
      })
    }
  }

  // Migrar configuraciones de proveedor
  for (const provider of providers) {
    const [memory, temperature, maxTokens] = await Promise.all([
      context.globalState.get(`${provider}_windowMemory`),
      context.globalState.get(`${provider}_temperature`),
      context.globalState.get(`${provider}_maxTokens`)
    ])

    if (memory !== undefined || temperature !== undefined || maxTokens !== undefined) {
      console.log('='.repeat(30))

      const payload = {
        provider,
        ...(memory ? { memory } : {}),
        ...(temperature ? { temperature } : {}),
        ...(maxTokens ? { max_tokens: maxTokens } : {})
      }

      await fetch('http://localhost:54112/api/migrate-sqlite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'config',
          ...payload
        })
      })
    }
  }

  // Migrar autoComplete
  const [
    autoCompleteEnabled,
    autoCompleteProvider,
    autoCompleteModel,
    autoCompleteMaxTokens,
    autoCompleteDelay
  ] = await Promise.all([
    context.globalState.get('autocompleteEnabled'),
    context.globalState.get('autocompleteProvider'),
    context.globalState.get('autocompleteModel'),
    context.globalState.get('autocompleteMaxTokens'),
    context.globalState.get('autocompleteSuggestionDelay')
  ])

  if (
    autoCompleteEnabled !== undefined ||
    autoCompleteProvider !== undefined ||
    autoCompleteModel !== undefined ||
    autoCompleteMaxTokens !== undefined ||
    autoCompleteDelay !== undefined
  ) {
    console.log('='.repeat(30))

    const payload = {
      enabled: autoCompleteEnabled === undefined ? true : autoCompleteEnabled ? 1 : 0,
      provider: autoCompleteProvider,
      model: autoCompleteModel ?? '',
      max_tokens: autoCompleteMaxTokens ?? 0,
      delay: autoCompleteDelay ?? 0
    }

    await fetch('http://localhost:54112/api/migrate-sqlite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'autoComplete',
        ...payload
      })
    })
  }

  // Migrar autoSelect
  const autoSelectEnabled = await context.globalState.get('autoSelect')
  if (autoSelectEnabled !== undefined) {
    console.log('='.repeat(30))

    const payload = { enabled: autoSelectEnabled ? 1 : 0 }

    await fetch('http://localhost:54112/api/migrate-sqlite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'autoSelect',
        ...payload
      })
    })
  }

  console.log('Data migration from VSCode to SQLite completed successfully.')
}

async function downloadAndExtract(url, libPatch) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  console.log({ libPatch })

  const tempFilePath = path.join(libPatch, 'temp.tar.gz')
  const fileStream = fs.createWriteStream(tempFilePath)
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream)
    response.body.on('error', reject)
    fileStream.on('finish', resolve)
  })

  await tar.x({
    file: tempFilePath,
    cwd: libPatch,
    filter: (path) => path.endsWith('better_sqlite3.node'),
    strip: 2 // Remove the first two directories (build/Release)
  })

  fs.unlinkSync(tempFilePath) // Remove the temporary file
  console.log('Extraction completed.')
}

function deleteCodeGPTFolder() {
  const homeDir = require('os').homedir()
  const codeGPTFolderPath = path.join(homeDir, '.codegpt')

  if (fs.existsSync(codeGPTFolderPath)) {
    fs.rmSync(codeGPTFolderPath, { recursive: true, force: true })
    console.log('.codegpt folder has been deleted.')
  } else {
    console.log('.codegpt folder does not exist.')
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  class DiffCodeLensProvider {
    constructor() {
      this.decorationRange = null
    }

    setDecorationRange(range) {
      this.decorationRange = range
    }

    provideCodeLenses(document, token) {
      if (!this.decorationRange) {
        return []
      }

      const start = new vscode.Position(this.decorationRange.start.line, 0)
      const end = new vscode.Position(this.decorationRange.end.line, 0)
      const range = new vscode.Range(start, end)

      return [
        new vscode.CodeLens(range, {
          title: 'Accept',
          command: 'codegpt.acceptDiff'
        }),
        new vscode.CodeLens(range, {
          title: 'Reject',
          command: 'codegpt.rejectDiff'
        })
      ]
    }
  }

  let globalDecorations = null
  let globalSelection = null
  // let globalCodeLensProvider = null
  let globalCodeLensDisposable = null
  let globalLines = null

  function getFirstCodeBlockContent(str) {
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)\s*```/
    const match = codeBlockRegex.exec(str)
    return match ? match[2] : null
  }

  // Function to show a loading message at the start and completed message at the end
  async function llmText(selectedText, prompt, progress) {
    console.log('llmText')
    progress.report({ message: 'Loading...' })

    const pathProvider = provider?.toLowerCase()?.replaceAll(' ', '')
    const model = await context.globalState.get(`${pathProvider}_model`)

    try {
      const llm = await fetch(`http://localhost:54112/${nextjsPort}/api/${pathProvider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          referer: `http://localhost:54112/${nextjsPort}`,
          ...(model ? { model: model.model } : {}),
          ...(model && model.fromMarketplace ? { fromMarketplace: model.fromMarketplace } : {})
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: selectedText
            }
          ]
        })
      })

      console.log({ llmStatus: llm.status, model })

      /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // send telemetry
      const codeGPTVersion = context.extension.packageJSON.version
      const language = vscode.env.language

      let isAnonymous = true
      try {
        const session = await getSession()
        const accessToken = JSON.parse(session)?.accessToken
        if (accessToken) {
          isAnonymous = false
        }
      } catch (e) {
        isAnonymous = true
      }

      const signedDistinctId = await getSession().then((session) => session?.signedDistinctId)

      const codeGPTUserId = await getDistinctId()

      console.log({ event: 'inlineCodeEditCodeGPT', isAnonymous, codeGPTUserId })

      await sendEvent(
        'inlineCodeEditCodeGPT',
        {
          prompt,
          language,
          codeGPTVersion,
          userType: isAnonymous ? 'anonymous' : 'registered'
        },
        codeGPTUserId,
        undefined,
        signedDistinctId
      )
      /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      const text = await llm.text()
      if (!llm.ok) {
        vscode.window.showErrorMessage(`
      LLM Error: ${text}
      status: ${llm.status}
      model: "${model.model}"
      provider: "${pathProvider}"
      `)
        throw new Error('LLM Error')
      }

      progress.report({ message: 'Completed.' })

      return getFirstCodeBlockContent(text) || text
    } catch (error) {
      progress.report({ message: 'Error occurred while making the request to LLM.' })
      throw error
    }
  }

  // Register command to fix selection
  const commandInlineCodeEditCodeGPT = vscode.commands.registerCommand(
    'codegpt.inlineCodeEditCodeGPT',
    async () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        return
      }

      const userInput = await vscode.window.showInputBox({
        title: 'Inline Code Edit CodeGPT',
        prompt: 'What do you want to edit?'
      })

      if (!userInput) {
        return
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'CodeGPT',
          cancellable: false
        },
        async (progress) => {
          progress.report({ message: 'Loading...' })

          try {
            const selection = editor.selection
            const selectedText = editor.document.getText(selection)

            const compareString = await llmText(
              selectedText,
              `I am a helpful programming expert assistant. Follow the user's instructions with precision and attention to detail. Minimize any additional text, edit the code in the selected text.
						Don't add any explanations or comments. Just edit the code as the user asked.
						user: ${userInput}
						`,
              progress
            )

            // First, update the text in the editor
            await editor.edit((editBuilder) => {
              editBuilder.replace(selection, compareString)
            })

            const newLines = compareString.split('\n').length - 1
            const lastLineLength = compareString.split('\n').pop().length

            let newSelection = new vscode.Selection(
              selection.start,
              selection.start.translate(newLines, lastLineLength)
            )
            editor.selection = newSelection

            await vscode.commands.executeCommand('editor.action.formatDocument')

            newSelection = editor.selection

            const newSelectionText = editor.document.getText(newSelection)

            const { updatedText, decorations, lines } = getDiff(
              editor,
              selectedText,
              newSelectionText,
              newSelection
            )

            await editor.edit((editBuilder) => {
              editBuilder.replace(newSelection, selectedText)
            })

            newSelection = editor.selection

            const codeLensProvider = new DiffCodeLensProvider()
            codeLensProvider.setDecorationRange(newSelection)
            const codeLensDisposable = vscode.languages.registerCodeLensProvider(
              '*',
              codeLensProvider
            )

            // Save decorations globally and the CodeLens disposable.
            globalDecorations = decorations
            globalSelection = newSelection
            globalCodeLensProvider = codeLensProvider
            globalCodeLensDisposable = codeLensDisposable
            globalLines = lines // Save lines globally

            await applyUpdatedTextAndDecorations(editor, updatedText, decorations, newSelection)

            progress.report({ message: 'Completed.' })
          } catch (error) {
            progress.report({ message: 'Error occurred while processing the selection.' })
            console.error(error)
          }
        }
      )
    }
  )

  // Function to get the difference
  function getDiff(editor, text1, text2, selection) {
    const fakeDiff = require('fake-diff')

    const addedRanges = []
    const removedRanges = []
    let currentLine = selection.start.line

    // Usar git-diff para obtener las diferencias
    const diff = fakeDiff(text1, text2, { hideLines: false })
    const newLines = []

    // Procesar las diferencias
    if (diff) {
      const diffLines = diff.split('\n')
      diffLines.forEach((line) => {
        const added = line.startsWith('+') && !line.startsWith('+++')
        const removed = line.startsWith('-') && !line.startsWith('---')
        if (added || removed) {
          const content = line.substring(3) // Eliminar prefijo + o -
          newLines.push(content) // Almacenar sin eliminar espacios

          const start = new vscode.Position(currentLine, 0)
          const end = new vscode.Position(currentLine, content.length)

          if (added) {
            addedRanges.push(new vscode.Range(start, end))
          } else if (removed) {
            removedRanges.push(new vscode.Range(start, end))
          }

          currentLine++
        } else {
          // Agregar líneas sin cambios
          if (!line.includes('No newline at end of file')) {
            newLines.push(line.substring(3)) // Usar la línea original
            currentLine++
          }
        }
      })
    } else {
      // Si no hay diferencias, simplemente retornar el texto original
      return {
        updatedText: text2, // Asumiendo que text2 es el texto actualizado
        decorations: { added: [], removed: [] },
        lines: text2.split('\n')
      }
    }

    return {
      updatedText: newLines.join('\n'),
      decorations: { added: addedRanges, removed: removedRanges },
      lines: newLines // Retornar las nuevas líneas con indentación preservada
    }
  }

  // Function to apply updated text and decorations
  async function applyUpdatedTextAndDecorations(editor, updatedText, decorations, selection) {
    const grayDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(128, 128, 128, 0.3)',
      isWholeLine: true
    })

    const addedDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(0,255,0,0.25)',
      isWholeLine: true
    })

    const removedDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255,0,0,0.25)',
      isWholeLine: true
    })

    const finalAddedDecorations = []
    const finalRemovedDecorations = []

    async function applyLineDecoration(range, finalDecorationType, finalDecorationList) {
      // Apply gray decoration
      editor.setDecorations(grayDecorationType, [range])

      // Wait for 35ms before applying the final decoration
      await new Promise((resolve) => setTimeout(resolve, 35))

      // Apply the final decoration
      finalDecorationList.push(range)
      editor.setDecorations(finalDecorationType, finalDecorationList)
    }

    await editor.edit((editBuilder) => {
      editBuilder.replace(selection, updatedText)
    })

    // await vscode.commands.executeCommand('editor.action.formatDocument');

    const allDecorations = [...decorations.added, ...decorations.removed]

    for (const range of allDecorations) {
      const isAdded = decorations.added.includes(range)
      const isRemoved = decorations.removed.includes(range)
      if (isAdded) {
        await applyLineDecoration(range, addedDecorationType, finalAddedDecorations)
      }
      if (isRemoved) {
        await applyLineDecoration(range, removedDecorationType, finalRemovedDecorations)
      }
    }

    // Ensure to clear any remaining gray decorations
    editor.setDecorations(grayDecorationType, [])

    // Capture the original decorations
    const currentDecorations = {
      added: finalAddedDecorations,
      removed: finalRemovedDecorations,
      addedDecorationType,
      removedDecorationType
    }

    const undoDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === editor.document) {
        // Remove decorations after undo operation
        clearDecorations(editor, currentDecorations)
        // Dispose the listener after usage
        undoDisposable.dispose()
      }
    })
  }

  // Function to clear decorations and disable CodeLens
  function clearDecorations(editor, currentDecorations) {
    if (
      currentDecorations &&
      currentDecorations.addedDecorationType &&
      currentDecorations.removedDecorationType
    ) {
      editor.setDecorations(currentDecorations.addedDecorationType, [])
      editor.setDecorations(currentDecorations.removedDecorationType, [])
    }

    globalDecorations = null
    globalSelection = null
    globalLines = null

    // Disposing the CodeLens
    if (globalCodeLensDisposable) {
      globalCodeLensDisposable.dispose()
      globalCodeLensDisposable = null
    }
  }

  const acceptDiffCommand = vscode.commands.registerCommand('codegpt.acceptDiff', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor || !globalDecorations || !globalSelection || !globalLines) {
      return
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'CodeGPT',
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: 'Loading...' })

        try {
          // Filter lines to keep only those that are not in red
          const startLine = globalSelection.start.line
          const linesToRemove = new Set(globalDecorations.removed.map((range) => range.start.line))

          const textToKeep =
            globalLines
              .filter((line, index) => !linesToRemove.has(startLine + index) && line !== undefined)
              .join('\n') + '\n'

          console.log({ globalLines, linesToRemove, textToKeep: textToKeep.split('\n') })

          // Range for the entire selection
          const entireRange = new vscode.Range(
            globalSelection.start.line,
            0,
            globalSelection.start.line + globalLines.length,
            0
          )

          console.log({ entireRange })

          // Replace the entire selected range with the filtered text
          await editor.edit((editBuilder) => {
            editBuilder.replace(entireRange, textToKeep)
          })

          // Clear decorations and the CodeLens
          clearDecorations(editor, globalDecorations)

          await vscode.commands.executeCommand('editor.action.formatDocument')

          /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // send telemetry
          const codeGPTVersion = context.extension.packageJSON.version
          const language = vscode.env.language

          let isAnonymous = true
          try {
            const session = await getSession()
            const accessToken = JSON.parse(session)?.accessToken
            if (accessToken) {
              isAnonymous = false
            }
          } catch (e) {
            isAnonymous = true
          }

          const signedDistinctId = await getSession().then((session) => session?.signedDistinctId)

          const codeGPTUserId = await getDistinctId()

          console.log({ event: 'inlineCodeEditCodeGPTAccept', isAnonymous, codeGPTUserId })

          await sendEvent(
            'inlineCodeEditCodeGPTAccept',
            {
              prompt,
              language,
              codeGPTVersion,
              userType: isAnonymous ? 'anonymous' : 'registered'
            },
            codeGPTUserId,
            undefined,
            signedDistinctId
          )
          /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

          progress.report({ message: 'Changes accepted.' })
        } catch (error) {
          progress.report({ message: 'Error occurred while accepting the changes.' })
        }
      }
    )
  })

  const rejectDiffCommand = vscode.commands.registerCommand('codegpt.rejectDiff', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor || !globalDecorations || !globalSelection || !globalLines) {
      return
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'CodeGPT',
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: 'Loading...' })

        try {
          // Filter lines to keep only those that are not in green
          const startLine = globalSelection.start.line
          const linesToRemove = new Set(globalDecorations.added.map((range) => range.start.line))
          const textToKeep =
            globalLines.filter((line, index) => !linesToRemove.has(startLine + index)).join('\n') +
            '\n'

          // Range for the entire selection
          const entireRange = new vscode.Range(
            globalSelection.start.line,
            0,
            globalSelection.start.line + globalLines.length,
            0
          )

          // Replace the entire selected range with the filtered text
          await editor.edit((editBuilder) => {
            editBuilder.replace(entireRange, textToKeep)
          })

          // Clear decorations and the CodeLens
          clearDecorations(editor, globalDecorations)
          await vscode.commands.executeCommand('editor.action.formatDocument')

          /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          // send telemetry
          const codeGPTVersion = context.extension.packageJSON.version
          const language = vscode.env.language

          let isAnonymous = true
          try {
            const session = await getSession()
            const accessToken = JSON.parse(session)?.accessToken
            if (accessToken) {
              isAnonymous = false
            }
          } catch (e) {
            isAnonymous = true
          }

          const signedDistinctId = await getSession().then((session) => session?.signedDistinctId)

          const codeGPTUserId = await getDistinctId()

          console.log({ event: 'inlineCodeEditCodeGPTReject', isAnonymous, codeGPTUserId })

          await sendEvent(
            'inlineCodeEditCodeGPTReject',
            {
              prompt,
              language,
              codeGPTVersion,
              userType: isAnonymous ? 'anonymous' : 'registered'
            },
            codeGPTUserId,
            undefined,
            signedDistinctId
          )
          /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

          progress.report({ message: 'Changes rejected.' })
        } catch (error) {
          progress.report({ message: 'Error occurred while rejecting the changes.' })
        }
      }
    )
  })

  const deleteAllGlobalState = () => {
    context.globalState.keys().forEach((key) => context.globalState.update(key, undefined))
    deleteCodeGPTFolder()
    vscode.commands.executeCommand('workbench.action.restartExtensionHost')
  }

  const deleteAllGlobalStateCommand = vscode.commands.registerCommand(
    'codegpt.resetCodeGPT',

    async () => {
      deleteAllGlobalState()
    }
  )

  try {
    /// PATCH
    const libPatch =
      context.extensionPath +
      '/standalone/node_modules/better-sqlite3-multiple-ciphers/build/Release/'
    const modulesVersion = process.versions.modules
    const isPatched = await fsPromises
      .readFile(libPatch + `${modulesVersion}.txt`, 'utf8')
      .catch((e) => {
        console.error({ e })
        return 'nope'
      })
    console.log({ firstIsPatched: isPatched })
    if (isPatched !== 'yep') {
      const regex = /.*-v\d+-.*/

      const response = await fetch(
        'https://api.github.com/repos/m4heshd/better-sqlite3-multiple-ciphers/releases/latest'
      )
      const json = await response.json()

      const versions = json.assets
        // .filter(a => a.name.includes('electron'))
        .map((a) => {
          const file = a.browser_download_url.split('/').find((text) => regex.test(text))
          const parts = file.split('-')
          const version = parts[6].substring(1) // Remove the 'v' at the beginning
          const extra = parts[8]
          const osArch = (extra ? `${parts[7]}-${extra}` : parts[7]).replace('.tar.gz', '') // Remove the extension
          const [platform, arch] = osArch.split('-')
          return {
            platform,
            arch,
            version,
            downloadUrl: a.browser_download_url
          }
        })

      const arch = process.arch
      const platform = process.platform
      const url = versions.find(
        (v) => v.platform === platform && v.arch === arch && v.version === modulesVersion
      ).downloadUrl
      console.log({
        arch,
        platform,
        url
      })

      const dir = path.dirname(libPatch + `${modulesVersion}.txt`)
      await fsPromises.mkdir(dir, { recursive: true })
      await fsPromises.rm(libPatch + 'better_sqlite3.node', { force: true })
      await downloadAndExtract(url, libPatch)
      await fsPromises.writeFile(libPatch + `${modulesVersion}.txt`, 'yep')
    }

    const waitUntilPatch = async () => {
      const isPatchedAlready = await fsPromises
        .access(libPatch + 'better_sqlite3.node', fs.constants.F_OK)
        .catch(() => false)
      console.log({ isPatchedAlready })
      if (isPatchedAlready === false) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return waitUntilPatch()
      }
    }
    await waitUntilPatch()
    ///
  } catch (e) {
    console.error(e)
  }

  const isDev = context.extension.packageJSON.main === './src/extension.js' // ya no hay que tocar mas nada en este archivo :)

  if (isDev) {
    // comentado en prod
  } else {
    //  comentado en dev
    nextjsPort = await getPort()
    const checkNextServer = () => {
      portfinder.getPort(
        {
          port: 54112,
          stopPort: 54112
        },
        (err, port) => {
          if (err) {
            // console.error(err);
          } else {
            const startNext = require('../standalone/server')
            startNext(54112)
              .then(() => {
                console.log('Server started')
              })
              .catch((err) => {
                console.error(err)
                const showErrorNotification = vscode.commands.registerCommand(
                  'notifications-sample.showNextError',
                  async () => {
                    await vscode.window.showInformationMessage(err)
                  }
                )

                // show info notification at startup
                showErrorNotification &&
                  vscode.commands.executeCommand('notifications-sample.showNextError')
              })
          }
        }
      )
    }
    checkNextServer()
    setInterval(() => {
      checkNextServer()
    }, 1500)
  }
  // hasta aca

  syncProvider = syncProviderHOF(context)
  autoSelectSend = autoSelectSendHOF(context)

  const autoSelect = await context.globalState.get('autoSelect')
  if (autoSelect === undefined) {
    await context.globalState.update('autoSelect', true)
  }

  const signedDistinctId = await getSession().then((session) => session?.signedDistinctId)

  const codeGPTUserId = await getDistinctId()

  const executeVscodeDriver = (context) => {
    try {
      vscodeDriver(context)
    } catch (e) {
      console.log(e)
      executeVscodeDriver(context)
    }
  }

  void executeVscodeDriver(context)

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('*', new CodeGPTQuickFixProvider())
  )

  // sidebar
  const chatSidebarProvider = ChatSidebarProvider.getChatInstance(context, nextjsPort)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codegpt-sidebar', chatSidebarProvider, {
      webviewOptions: {
        retainContextWhenHidden: true
      }
    })
  )

  // Registrar el comando para generar el mensaje del commit
  const generateCommitMessage = vscode.commands.registerCommand(
    'codegpt.generateCommitMessage',
    async () => {
      vscode.window.showInformationMessage('Generating commit message...')

      const gitExtension = vscode.extensions.getExtension('vscode.git').exports
      const api = gitExtension.getAPI(1)
      const repository = api.repositories[0]

      if (!repository) {
        vscode.window.showErrorMessage('No Git repository found.')
        return
      }

      // Obtener la lista de cambios en los archivos
      const changes = repository.state.workingTreeChanges
      if (changes.length === 0) {
        vscode.window.showErrorMessage('No changes found in the working directory.')
        return
      }

      // Obtener el diff de los archivos modificados
      let diffs = ''
      for (const change of changes) {
        const diff = await repository.diffWithHEAD(change.uri.fsPath)
        diffs += `diff --git a/${change.uri.path} b/${change.uri.path}\n${diff}\n`
      }

      // Obtener los últimos commits del usuario
      const repoCommits = await repository.log({ maxEntries: 5 })
      const recentRepoCommits = repoCommits
        .map((commit) => commit.message)
        .map((message) => `\`\`\`text\n${message}\n\`\`\``)
        .join('\n')

      // Preparar el mensaje para la API de OpenAI
      const messages = [
        {
          role: 'system',
          content:
            "You are an AI programming assistant, helping a software developer to come with the best git commit message for their code changes. You excel in interpreting the purpose behind code changes to craft succinct, clear commit messages that adhere to the repository's guidelines. # Examples of commit messages: ```text feat: improve page load with lazy loading for images ``` ```text Fix bug preventing submitting the signup form ``` ```text chore: update npm dependency to latest stable version ``` ```text Update landing page banner color per client request ``` # First, think step-by-step: 1. Analyze the CODE CHANGES thoroughly to understand what's been modified. 2. Identify the purpose of the changes to answer the *why* for the commit messages, also considering the optionally provided RECENT USER COMMITS. 3. Review the provided RECENT REPOSITORY COMMITS to identify established commit message conventions. Focus on the format and style, ignoring commit-specific details like refs, tags, and authors. 4. Generate a thoughtful and succinct commit message for the given CODE CHANGES. It MUST follow the the established writing conventions. 5. Remove any meta information like issue references, tags, or author names from the commit message. The developer will add them. 6. Now only show your message, wrapped with a single markdown ```text codeblock! Do not provide any explanations or details Follow Microsoft content policies. Avoid content that violates copyrights. If you are asked to generate content that is harmful, hateful, racist, sexist, lewd, violent, or completely irrelevant to software engineering, only respond with \"Sorry, I can't assist with that.\" Keep your answers short and impersonal."
        },
        {
          role: 'user',
          content: `# CODE CHANGES:\n\`\`\`diff\n${diffs}\n\`\`\``
        },
        {
          role: 'user',
          content: `# RECENT REPO COMMITS:\n${recentRepoCommits}`
        },
        {
          role: 'user',
          content:
            'Remember to ONLY return a single markdown ```text code block with the suggested commit message. NO OTHER PROSE! If you write more than the commit message, your commit message gets lost.\nExample:\n```text\ncommit message goes here\n```'
        }
      ]

      const vicunaSession = await getSession()
      const { accessToken } = JSON.parse(vicunaSession)

      // Hacer la solicitud a la API de OpenAI
      const response = await fetch('https://api.codegpt.co/api/v1/chat/completion', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          tokens: 'true',
          source: 'api',
          channel: 'vscode'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.1,
          stream: false
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          notify(
            'You are not authorized to use this feature. Please sign in to CodeGPT to access this feature.',
            'error'
          )
        }
      }

      const data = await response.text()

      const commitMessage = data.match(/```.*?\n([\s\S]*?)\n```/)?.[1] ?? data

      // Insertar el mensaje de commit generado en el cuadro de entrada de commit de Git
      if (commitMessage) {
        repository.inputBox.value = commitMessage
      }
    }
  )

  context.subscriptions.push(generateCommitMessage)

  const firstTimeConfig = async () => {
    const autocompleteEnabled = await context.globalState.get('autocompleteEnabled')
    if (!autocompleteEnabled) {
      await context.globalState.update('autocompleteEnabled', true)
    }
    const autocompleteProvider = await context.globalState.get('autocompleteProvider')
    if (!autocompleteProvider) {
      await context.globalState.update('autocompleteProvider', 'CodeGPT Plus')
    }
    const autocompleteModel = await context.globalState.get('autocompleteModel')
    if (!autocompleteModel) {
      await context.globalState.update('autocompleteModel', 'Plus')
    }
    const autocompleteMaxTokens = await context.globalState.get('autocompleteMaxTokens')
    if (!autocompleteMaxTokens) {
      await context.globalState.update('autocompleteMaxTokens', 300)
    }
    const autocompleteSuggestionDelay = await context.globalState.get('autocompleteSuggestionDelay')
    if (!autocompleteSuggestionDelay) {
      await context.globalState.update('autocompleteSuggestionDelay', 300)
    }
    const Ollama_customLink = await context.secrets.get('Ollama_customLink')
    if (!Ollama_customLink) {
      await context.secrets.store('Ollama_customLink', 'http://localhost:11434')
    }
  }

  await firstTimeConfig()

  const alreadySyncedSqlite = await context.globalState.get('alreadySyncedSqlite.')

  if (!alreadySyncedSqlite) {
    await migrateToSqlite(context)
    await context.globalState.update('alreadySyncedSqlite.', true)
  }

  const configManager = new ConfigurationManager()
  log('Registering CodeGPT Copilot provider')

  let enable = configManager.config.enable
  configManager.onUpdatedConfig(() => {
    enable = configManager.config.enable
  })

  if (enable) {
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
    statusBar.text = '$(codegpt-logotype)'
    statusBar.tooltip = 'CodeGPT Copilot - Ready'

    context.subscriptions.push(
      vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**' },
        // @ts-ignore
        new CodeGPTCopilotProvider(statusBar, log, context)
      ),
      statusBar
    )

    if (await context.globalState.get('autocompleteEnabled')) {
      statusBar.show()
    } else {
      statusBar.hide()
    }
    statusBar.show()
  }

  // Show start notification
  const vicunaSession = await getSession()

  // if there is a saved session, set the logged in flag
  if (vicunaSession) {
    try {
      const { accessToken } = JSON.parse(vicunaSession)
      // if (accessToken) { context.globalState.update("CodeGPTLoggedIn", true); }
      if (accessToken) {
        console.log('logged in')
      } else {
        const showInfoNotification = vscode.commands.registerCommand(
          'notifications-sample.showInfo',
          async () => {
            const selection = await vscode.window.showInformationMessage(
              'Connect to CodeGPT Plus to get access to more AI Models',
              'Sign Up',
              'Sign In'
            )

            if (selection) {
              const connectionId = uuidv4()

              if (selection === 'Sign Up') {
                vscode.env.openExternal(
                  vscode.Uri.parse(
                    `https://app.codegpt.co/signup?source=vscode&distinct_id=${codeGPTUserId}&connection_id=${connectionId}`
                  )
                )
              }
              if (selection === 'Sign In') {
                vscode.env.openExternal(
                  vscode.Uri.parse(
                    `https://app.codegpt.co/login?source=vscode&distinct_id=${codeGPTUserId}&connection_id=${connectionId}`
                  )
                )
              }

              const res = await fetch(
                `https://api.codegpt.co/api/v1/vscode/connection/${connectionId}`
              )

              const text = await res.text()

              const body = text.split('data: ')[1]

              const json = JSON.parse(body)

              const {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt
              } = json

              await fetch('http://localhost:54112/api/migrate-sqlite', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: 'session',
                  signed_distinct_id: signedDistinctId,
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  expires_at: expiresAt
                })
              })
            }
            // if (selection === 'Read More') {
            //   vscode.env.openExternal(vscode.Uri.parse('https://www.codegpt.co/plus'))
            // }
          }
        )
        showInfoNotification && vscode.commands.executeCommand('notifications-sample.showInfo')
      }
    } catch {}
  } else {
    // if not, check if there is a saved session in the globalState and according to that show the message
    // const loggedIn = context.globalState.get("CodeGPTLoggedIn");
    // if (!loggedIn) {}
    const showInfoNotification = vscode.commands.registerCommand(
      'notifications-sample.showInfo',
      async () => {
        const selection = await vscode.window.showInformationMessage(
          // Vuelve a iuniciar el sesion
          'Sign In to use CodeGPT Plus Features',
          'Sign In'
        )
        if (selection === 'Sign In') {
          const connectionId = uuidv4()

          vscode.env.openExternal(
            vscode.Uri.parse(
              `https://app.codegpt.co/login?source=vscode&distinct_id=${codeGPTUserId}&connection_id=${connectionId}`
            )
          )

          const res = await fetch(`https://api.codegpt.co/api/v1/vscode/connection/${connectionId}`)

          const text = await res.text()

          const body = text.split('data: ')[1]

          const json = JSON.parse(body)

          const {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
          } = json

          await fetch('http://localhost:54112/api/migrate-sqlite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'session',
              signed_distinct_id: signedDistinctId,
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt
            })
          })
        }
      }
    )
    showInfoNotification && vscode.commands.executeCommand('notifications-sample.showInfo')
  }

  // Commands
  const getCode = vscode.commands.registerCommand('codegpt.getCode', async () => {
    const editor = vscode.window.activeTextEditor
    const { document } = editor
    let { languageId } = document

    // terraform exeption
    if (languageId === 'tf') {
      languageId = 'terraform'
    }
    let notebook = false
    if (languageId === 'python') {
      notebook = true
    }

    const cursorPosition = editor.selection.active
    const selection = new vscode.Selection(
      cursorPosition.line,
      0,
      cursorPosition.line,
      cursorPosition.character
    )
    const comment = document.getText(selection)
    const commentCharacter = language.detectLanguage(languageId)
    const oneShotPrompt = languageId
    const errorMessageCursor =
      'Create a comment and leave the cursor at the end of the comment line'
    if (comment === '') {
      vscode.window.showErrorMessage(errorMessageCursor)
      return
    }
    // el caracter existe
    const existsComment = comment.includes(commentCharacter)
    if (!existsComment) {
      vscode.window.showErrorMessage(errorMessageCursor)
      return
    }

    if (commentCharacter === false) {
      vscode.window.showErrorMessage('This language is not supported')
      return
    }
    const finalComment = comment.replaceAll(commentCharacter, oneShotPrompt + ': ')
    if (notebook) {
      getCodeGPTOutput(finalComment, 'getCodeGPT', context, languageId, [], notebook)
    } else {
      startCodeGPTCommand({ type: 'getCodeGPT' })
    }
  })

  const startCodeGPTCommand = ({ type, errorText, openChat = true }) => {
    if (openChat) {
      openChatView()
    }

    if (type === 'copyFromTerminal') {
      const chatSidebarProvider = ChatSidebarProvider.getChatInstance(context)
      const selectedText = vscode.window.activeTerminal?.selection
      chatSidebarProvider.view.webview.postMessage({
        type: 'copyFromTerminalCodeGPT',
        ok: true,
        selectedText,
        fileName: 'Terminal',
        language: 'zsh',
        from: 1,
        to: 1,
        lines: 1,
        lineAt: 1
      })
      return
    }

    const selection = vscode.window.activeTextEditor.selection
    let selectedText = errorText || vscode.window.activeTextEditor.document.getText(selection)
    const chatSidebarProvider = ChatSidebarProvider.getChatInstance(context)

    if (type === 'getCodeGPT') {
      const editor = vscode.window.activeTextEditor
      const { document } = editor
      const { languageId } = document

      const cursorPosition = editor.selection.active
      const selection = new vscode.Selection(
        cursorPosition.line,
        0,
        cursorPosition.line,
        cursorPosition.character
      )
      const comment = document.getText(selection)
      const commentCharacter = language.detectLanguage(languageId)
      const oneShotPrompt = languageId
      const errorMessageCursor =
        'Create a comment and leave the cursor at the end of the comment line'
      if (comment === '') {
        vscode.window.showErrorMessage(errorMessageCursor)
        return
      }
      // el caracter existe
      const existsComment = comment.includes(commentCharacter)
      if (!existsComment) {
        vscode.window.showErrorMessage(errorMessageCursor)
        return
      }

      const finalComment = comment.replaceAll(commentCharacter, oneShotPrompt + ': ')

      selectedText = finalComment
    }

    if (selectedText === '' && type !== 'selectionCodeGPT') {
      notify('To use this function, please select some text first.', 'error')
    } else {
      notifyBar('Copying to Chat textarea')
      if (!chatSidebarProvider.view) {
        openChatView()
        setTimeout(() => {
          chatSidebarProvider.view.webview.postMessage({
            type,
            ok: true,
            selectedText,
            fileName: vscode.window.activeTextEditor.document.fileName
              .split('/')
              .pop()
              .split('.')[0],
            language: vscode.window.activeTextEditor.document.languageId,
            from: vscode.window.activeTextEditor.selection.start,
            to: vscode.window.activeTextEditor.selection.end,
            lines: vscode.window.activeTextEditor.document.lineCount,
            lineAt: vscode.window.activeTextEditor.document.lineAt(selection.active)
          })
        }, 1000)
      } else {
        chatSidebarProvider.view.webview.postMessage({
          type,
          ok: true,
          selectedText,
          fileName: vscode.window.activeTextEditor.document.fileName.split('/').pop().split('.')[0],
          language: vscode.window.activeTextEditor.document.languageId,
          from: vscode.window.activeTextEditor.selection.start,
          to: vscode.window.activeTextEditor.selection.end,
          lines: vscode.window.activeTextEditor.document.lineCount,
          lineAt: vscode.window.activeTextEditor.document.lineAt(selection.active)
        })
      }
    }
  }

  // notify when user make a selection commandSelectionCodeGPT // vscode.window.onchange;
  // vscode.window.onDidChangeTextEditorSelection(() => {
  //	startCodeGPTCommand({ type: "selectionCodeGPT" });
  // });

  const commandSelectionCodeGPT = vscode.commands.registerCommand(
    'codegpt.selectionCodeGPT',
    async () => {
      startCodeGPTCommand({ type: 'selectionCodeGPT' })
    }
  )

  // Escuchar cambios de pestañas activas
  vscode.window.onDidChangeActiveTextEditor(async () => {
    const isAutoSelect = Boolean(await context.globalState.get('autoSelect'))
    if (isAutoSelect) {
      autoSelectSend()
    }
  })

  // Escuchar cambios de texto en el editor activo
  vscode.window.onDidChangeTextEditorSelection(async (event) => {
    const isAutoSelect = Boolean(await context.globalState.get('autoSelect'))
    const fullText = vscode.window.activeTextEditor.document.getText()
    const lastFullText = await context.globalState.get('lastFullText')
    if (isAutoSelect && fullText !== lastFullText) {
      await context.globalState.update('lastFullText', fullText)
      autoSelectSend()
    }

    autoSelectSend()
  })

  const commandExplainCodeGPT = vscode.commands.registerCommand(
    'codegpt.explainCodeGPT',

    async () => {
      startCodeGPTCommand({ type: 'explainCodeGPT' })
    }
  )

  // Function to get the first code block content

  const commandOnCompletionAccepted = vscode.commands.registerCommand(
    'codegpt.onCompletionAccepted',
    async (choiceText, toSent, autocompleteId) => {
      if (toSent) {
        console.log('event sent')
        const codeGPTUserId = await getDistinctId()
        const codeGPTVersion = context.extension.packageJSON.version
        const autocompleteProvider = await context.globalState.get('autocompleteProvider')
        const autocompleteModel = await context.globalState.get('autocompleteModel')
        const codeLanguage = vscode.window.activeTextEditor.document.languageId
        const language = vscode.env.language
        const session = await getSession()
        let accessToken = null
        try {
          accessToken = JSON.parse(session)?.accessToken
        } catch (e) {
          console.log(e)
        }
        sendEvent(
          'autoCompleteAccepted',
          {
            provider: autocompleteProvider,
            model: autocompleteModel,
            language,
            codeLanguage,
            autocompleteId,
            codeGPTVersion,
            userType: !accessToken ? 'anonymous' : 'registered'
          },
          codeGPTUserId,
          accessToken,
          signedDistinctId
        ).catch((err) => console.error(err))
      }

      // vscode.commands.executeCommand("editor.action.formatSelection");
      const editor = vscode.window.activeTextEditor
      if (editor) {
        const document = editor.document
        const position = editor.selection.active // Get current cursor position

        const languageId = document.languageId
        const config = vscode.workspace.getConfiguration('editor', { languageId })
        const defaultFormatter = config.get('defaultFormatter')
        if (!defaultFormatter) return

        // Calculate the range of the inserted text (`choiceText`)
        const start = position.translate(0, -choiceText.length) // Start position before the inserted text
        const end = position // Current position (after insertion)

        // Find the first previous non-empty line
        // let expandedStartLine = start.line;
        // for (let line = start.line - 1; line >= 0; line--) {
        // 	const lineText = document.lineAt(line).text;
        // 	if (lineText.trim().length > 0) {
        // 		expandedStartLine = line;
        // 		break;
        // 	}
        // }
        // const expandedStart = new vscode.Position(expandedStartLine, 0); // latest non-empty line
        // const expandedEnd = new vscode.Position(Math.min(document.lineCount - 1, end.line + 1), 0); // next line
        const range = new vscode.Range(start, end)

        // Get formatting edits for the range without changing the selection
        const formattingEdits = await vscode.commands.executeCommand(
          'vscode.executeFormatRangeProvider',
          document.uri,
          range,
          {
            tabSize: editor.options.tabSize,
            insertSpaces: editor.options.insertSpaces
          }
        )

        if (formattingEdits && formattingEdits.length > 0) {
          // Apply the formatting edits directly
          await editor.edit((editBuilder) => {
            for (const edit of formattingEdits) {
              editBuilder.replace(edit.range, edit.newText)
            }
          })
        }
      }
    }
  )

  const commandQuickFixCodeGPT = vscode.commands.registerCommand(
    'codegpt.quickFixCodeGPT',
    async (errorText) => {
      startCodeGPTCommand({
        type: 'quickFixCodeGPT',
        errorText
      })
    }
  )

  const commandFindProblemsCodeGPT = vscode.commands.registerCommand(
    'codegpt.findProblemsCodeGPT',
    async () => {
      startCodeGPTCommand({ type: 'fixCodeGPT' })
    }
  )

  const commandUnitTestCodeGPT = vscode.commands.registerCommand(
    'codegpt.unitTestCodeGPT',
    async () => {
      startCodeGPTCommand({ type: 'unitTestCodeGPT' })
    }
  )

  const commandfixCodeGPT = vscode.commands.registerCommand('codegpt.fixCodeGPT', async () => {
    startCodeGPTCommand({ type: 'fixCodeGPT' })
  })

  const commandDocumentCodeGPT = vscode.commands.registerCommand(
    'codegpt.documentCodeGPT',
    async () => {
      startCodeGPTCommand({ type: 'documentCodeGPT' })
    }
  )

  const commandRefactorCodeGPT = vscode.commands.registerCommand(
    'codegpt.refactorCodeGPT',
    async () => {
      startCodeGPTCommand({ type: 'refactorCodeGPT' })
    }
  )

  const commandAboutCodeGPT = vscode.commands.registerCommand('codegpt.aboutCodeGPT', async () => {
    openExternalView('https://docs.codegpt.co/docs/intro')
  })

  const runJupyterNotebook = vscode.commands.registerCommand(
    'codegpt.runJupyterNotebook',
    async () => {
      const editor = vscode.window.activeTextEditor
      const selection = vscode.window.activeTextEditor.selection
      const selectedText = vscode.window.activeTextEditor.document.getText(selection)

      const { document } = editor
      const { languageId } = document

      if (languageId !== 'python') {
        vscode.window.showErrorMessage(
          'This language is not supported, Code Interpreter only runs on top of the Python language at the moment'
        )
        return
      }

      getCodeGPTOutput(selectedText, 'getCodeGPT', context, languageId, [], true)
    }
  )

  const signInChatCodeGPT = vscode.commands.registerCommand(
    'codegpt.signInChatCodeGPT',
    async () => {
      const connectionId = uuidv4()

      vscode.env.openExternal(
        vscode.Uri.parse(
          `https://app.codegpt.co/login?source=vscode&distinct_id=${codeGPTUserId}&connection_id=${connectionId}`
        )
      )

      const res = await fetch(`https://api.codegpt.co/api/v1/vscode/connection/${connectionId}`)

      const text = await res.text()

      const body = text.split('data: ')[1]

      const json = JSON.parse(body)

      const { access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt } = json

      await fetch('http://localhost:54112/api/migrate-sqlite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'session',
          signed_distinct_id: signedDistinctId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt
        })
      })
    }
  )

  const signUpCodeGPT = vscode.commands.registerCommand('codegpt.signUpCodeGPT', async () => {
    const connectionId = uuidv4()

    vscode.env.openExternal(
      vscode.Uri.parse(
        `https://app.codegpt.co/signup?source=vscode&distinct_id=${codeGPTUserId}&connection_id=${connectionId}`
      )
    )

    const res = await fetch(`https://api.codegpt.co/api/v1/vscode/connection/${connectionId}`)

    const text = await res.text()

    const body = text.split('data: ')[1]

    const json = JSON.parse(body)

    const { access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt } = json

    await fetch('http://localhost:54112/api/migrate-sqlite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'session',
        signed_distinct_id: signedDistinctId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt
      })
    })
  })

  const commandOpenReviewCodeGPT = vscode.commands.registerCommand(
    'codegpt.openReviewCodeGPT',
    async () => {
      vscode.env.openExternal(
        vscode.Uri.parse(
          'https://marketplace.visualstudio.com/items?itemName=DanielSanMedium.dscodegpt&ssr=false#review-details'
        )
      )
    }
  )

  const commandCopyFromTerminal = vscode.commands.registerCommand(
    'codegpt.copyFromTerminal',
    async () => {
      startCodeGPTCommand({ type: 'copyFromTerminal' })
    }
  )

  // subscribed events
  context.subscriptions.push(
    signInChatCodeGPT,
    signUpCodeGPT,
    commandExplainCodeGPT,
    commandRefactorCodeGPT,
    commandDocumentCodeGPT,
    commandFindProblemsCodeGPT,
    commandQuickFixCodeGPT,
    getCode,
    commandUnitTestCodeGPT,
    commandAboutCodeGPT,
    runJupyterNotebook,
    commandSelectionCodeGPT,
    commandOnCompletionAccepted,
    commandCopyFromTerminal,
    commandOpenReviewCodeGPT,
    commandInlineCodeEditCodeGPT,
    acceptDiffCommand,
    rejectDiffCommand,
    commandfixCodeGPT,
    deleteAllGlobalStateCommand
  )

  const isAutoSelect = Boolean(await context.globalState.get('autoSelect'))
  if (isAutoSelect) {
    setTimeout(() => {
      autoSelectSend()
    }, 3000)
  }
}

function openChatView() {
  vscode.commands.executeCommand('workbench.view.extension.codegpt-sidebar-view')
}

/* function closeChatView () {
  vscode.commands.executeCommand('workbench.action.closeSidebar')
} */

// This method is called when your extension is deactivated
function deactivate() {
  log('Deactivating CodeGPT Copilot provider')
}

// STATUS BAR NOTIFICATIONS
async function notifyBar(text) {
  // const statusBarNoty = vscode.window.createStatusBarItem(
  // 	vscode.StatusBarAlignment.Right,
  // 	0
  // );
  // statusBarNoty.show();
  // statusBarNoty.text = text;
  // statusBarNoty.show();
  // setTimeout(() => {
  // 	statusBarNoty.hide();
  // }, 2000);

  const progressOptions = {
    location: vscode.ProgressLocation.Window,
    title: 'CodeGPT'
  }

  await vscode.window.withProgress(progressOptions, async (progress) => {
    for (let i = 0; i <= 100; i++) {
      progress.report({ message: text, increment: 1 })
      vscode.window.showWarningMessage(text)
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  })
}
// Toas Like NOTIFICATIONS
async function notify(text, type) {
  // const progressOptions = {
  // 	location: vscode.ProgressLocation.Notification,
  // 	title: "CodeGPT",
  // };

  // await vscode.window.withProgress(progressOptions, async (progress) => {
  //   vscode.window.showErrorMessage(text);
  // 	for (let i = 0; i <= 100; i++) {
  // 		progress.report({ message: text, increment: 1 });
  // 		vscode.window.showWarningMessage(text);
  // 		await new Promise((resolve) => setTimeout(resolve, 10));
  // 	}
  // });

  if (type === 'error') {
    vscode.window.showErrorMessage(text)
  }
  if (type === 'warning') {
    vscode.window.showWarningMessage(text)
  }
  if (type === 'info') {
    vscode.window.showInformationMessage(text)
  }
}

class CodeGPTQuickFixProvider {
  provideCodeActions(document, range, context, token) {
    const diagnostics = context.diagnostics

    // Creamos un comando Quick Fix por cada diagnóstico (error) en la selección
    return diagnostics.map((diagnostic) => this.createQuickFixCommand(document, diagnostic))
  }

  createQuickFixCommand(document, diagnostic) {
    const quickFix = new vscode.CodeAction('Fix this with CodeGPT', vscode.CodeActionKind.QuickFix)

    // Extraemos la línea del código que tiene el error
    const problematicCode = document.getText(diagnostic.range)

    // Obtenemos el lenguaje del documento
    const languageId = document.languageId

    const languageMap = (languageId) => {
      if (languageId.toLowerCase() === 'typescriptreact') {
        return 'tsx'
      }
      if (languageId.toLowerCase() === 'javascriptreact') {
        return 'jsx'
      }
      return languageId
    }

    const language = languageMap(languageId)

    // Calcular el rango extendido (3 líneas hacia arriba y hacia abajo)
    const extendedRange = new vscode.Range(
      Math.max(0, diagnostic.range.start.line - 5),
      0,
      Math.min(document.lineCount - 1, diagnostic.range.end.line + 5),
      document.lineAt(Math.min(document.lineCount - 1, diagnostic.range.end.line + 5)).text.length
    )

    // Extraemos el código dentro del rango extendido
    const extendedCode = document.getText(extendedRange)

    // Construimos un mensaje limpio con la información del error, el código problemático y el contexto extendido
    const cleanMessage = `Message: ${diagnostic.message}\nProblematic code: ${problematicCode}\nContext:\n\`\`\`${language}\n${extendedCode}\n\`\`\``

    // Configura el comando para el Quick Fix, pasando `cleanMessage` como argumento
    quickFix.command = {
      command: 'codegpt.quickFixCodeGPT',
      title: 'Fix this with CodeGPT',
      arguments: [cleanMessage]
    }

    return quickFix
  }
}

module.exports = {
  activate,
  deactivate
}
