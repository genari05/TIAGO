const vscode = require('vscode')

const openExternalView = (url) => {
  // Crear un nuevo WebView
  const panel = vscode.window.createWebviewPanel(
    'codegpt-panel-external-view',
    'CodeGPT external',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true
    }
  )

  const { webview } = panel

  const nonce = getNonce()

  const html = `
    <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${url}; img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <title>VSCode Webview</title>
  </head>
  <body style="background: black; margin: 0; padding: 0; border: 0;">
    <iframe id="myIframe" src="${url}" style="width: 100%; height: 100vh; border: none;" sandbox="allow-scripts allow-same-origin allow-forms" allow="clipboard-read; clipboard-write;"></iframe>
  </body>
  </html>`

  console.log(html)
  panel.webview.html = html
}

function getNonce () {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// Registrar el comando para mostrar el WebView
module.exports = { openExternalView }
