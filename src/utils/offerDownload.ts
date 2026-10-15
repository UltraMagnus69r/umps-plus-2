import { Capacitor } from '@capacitor/core'

/**
 * Deliver a Blob to the user as a download / share target.
 *
 * Browser: classic `<a download>` click.
 * Capacitor (Android/iOS): write to cache via Filesystem, then open the system
 * Share sheet so the user can Save to Files / Downloads / Drive / Photos.
 * Anchor downloads are ignored inside the WebView, which broke Save/PNG.
 */
export async function offerDownload(blob: Blob, filename: string): Promise<void> {
  const safeName = (filename || 'download').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'download'

  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ])

    const base64 = await blobToBase64(blob)
    const path = `umps-exports/${Date.now()}-${safeName}`
    const written = await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })

    await Share.share({
      title: safeName,
      text: safeName,
      url: written.uri,
      dialogTitle: 'Save or share',
    })
    return
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unexpected FileReader result'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.readAsDataURL(blob)
  })
}
