const { app, BrowserWindow, shell, protocol, net } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

/**
 * Root-absolute asset URLs (`/fonts/...`, `/mana/...`, `/premodern-rules-textbox/...`)
 * match Capacitor's https://localhost scheme. loadFile(file://) resolves those to the
 * OS filesystem root and breaks Konva frames, mana pips, and @font-face. Serve dist/
 * under a privileged custom protocol so absolute paths work like the web/Android builds.
 */
const SCHEME = 'umps'

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
])

const isDev = !app.isPackaged

function getDistRoot() {
  return path.join(__dirname, '..', 'dist')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'PipMint',
    backgroundColor: '#0a0c0e',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.loadURL(`${SCHEME}://localhost/index.html`)

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(() => {
  const distRoot = path.resolve(getDistRoot())

  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url)
    let rel = decodeURIComponent(pathname)
    if (!rel || rel === '/') rel = '/index.html'

    const resolved = path.resolve(path.join(distRoot, rel))
    const relative = path.relative(distRoot, resolved)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return new Response('Forbidden', { status: 403 })
    }

    return net.fetch(pathToFileURL(resolved).href)
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
