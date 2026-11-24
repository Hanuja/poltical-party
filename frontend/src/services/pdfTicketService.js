// Print-ready PDF ticket + QR image downloads.
//
// The ticket is rendered by the browser (so Tamil / Sinhala names shape correctly), captured with
// html2canvas-pro, and placed on an A4 page. The attendee QR is then drawn on top from a separate
// 1024 px canvas, so the code in the PDF is pixel-sharp and scans reliably when printed.
// The libraries are loaded only when someone actually downloads a ticket.

const MM = { pageW: 210, pageH: 297, margin: 15 }

/** Draw the QR source canvas onto a white square with a quiet zone and the code underneath. */
export function composeQrImage(qrCanvas, code, { size = 1024, caption = true } = {}) {
  const pad = Math.round(size * 0.08)
  const textH = caption ? Math.round(size * 0.12) : 0
  const c = document.createElement('canvas')
  c.width = size + pad * 2
  c.height = size + pad * 2 + textH
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qrCanvas, pad, pad, size, size)
  if (caption) {
    ctx.fillStyle = '#7A0019'
    ctx.font = `700 ${Math.round(size * 0.055)}px ui-monospace, Menlo, Consolas, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(code, c.width / 2, size + pad * 1.5 + textH / 2)
  }
  return c
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/** Save the attendee (or event) QR as a PNG. */
export function downloadQrPng(qrCanvas, code, filename) {
  const c = composeQrImage(qrCanvas, code)
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (!blob) return reject(new Error('QR image could not be created'))
      triggerDownload(blob, filename || `Ticket-QR-${code}.png`)
      resolve()
    }, 'image/png')
  })
}

/**
 * Build and save Official-Ticket-{code}.pdf
 * @param {HTMLElement} ticketEl  the fixed-layout ticket (DigitalTicket variant="print")
 * @param {HTMLCanvasElement} qrHiRes 1024 px QR canvas for the same ticket
 * @param {object} ticket ticket data from the API
 */
export async function downloadTicketPdf(ticketEl, qrHiRes, ticket) {
  const [{ jsPDF }, html2canvasMod] = await Promise.all([import('jspdf'), import('html2canvas-pro')])
  const html2canvas = html2canvasMod.default || html2canvasMod
  if (document.fonts?.ready) await document.fonts.ready

  const shot = await html2canvas(ticketEl, {
    scale: 3, backgroundColor: '#FFFFFF', useCORS: true, logging: false,
    windowWidth: ticketEl.scrollWidth, windowHeight: ticketEl.scrollHeight,
    // leave the QR out of the snapshot: only the pixel-exact 1024 px copy below ends up in the PDF
    onclone: (doc) => doc.querySelectorAll('[data-ticket-qr] canvas').forEach((c) => { c.style.visibility = 'hidden' }),
  })

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({ title: `Official Ticket ${ticket.ticketCode}`, subject: ticket.event?.title || 'Event ticket', creator: 'RISE' })
  const w = MM.pageW - MM.margin * 2
  const h = (shot.height / shot.width) * w
  const x = MM.margin
  const y = 30

  // page heading
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(122, 0, 25)
  doc.text('OFFICIAL EVENT TICKET', x, 18)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 107, 107)
  doc.text(ticket.ticketCode, MM.pageW - MM.margin, 18, { align: 'right' })
  doc.setDrawColor(234, 179, 8); doc.setLineWidth(0.6); doc.line(x, 21.5, MM.pageW - MM.margin, 21.5)

  // the ticket artwork as high-quality JPEG (small file); the QR goes on top as lossless PNG below
  doc.addImage(shot.toDataURL('image/jpeg', 0.92), 'JPEG', x, y, w, h, undefined, 'FAST')

  // overlay the high-resolution QR exactly over the on-ticket QR
  const qrEl = ticketEl.querySelector('[data-ticket-qr]')
  if (qrEl && qrHiRes) {
    const tr = ticketEl.getBoundingClientRect()
    const qr = qrEl.getBoundingClientRect()
    const k = w / tr.width
    // both QRs are drawn without a built-in margin (the white quiet zone is the ticket's padding),
    // so the 1024 px version lines up module-for-module with the captured one
    doc.addImage(qrHiRes.toDataURL('image/png'), 'PNG', x + (qr.left - tr.left) * k, y + (qr.top - tr.top) * k,
      qr.width * k, qr.height * k, undefined, 'FAST') // Flate = lossless, so every QR module stays exact
  }

  // instructions
  let ty = y + h + 12
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(23, 23, 23)
  doc.text('At the entrance', x, ty)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(82, 82, 82)
  const lines = doc.splitTextToSize(
    'Show this ticket - printed or on your phone - at the event entrance. Staff will scan the QR code to check you in. ' +
    'The QR code is personal to you and is valid for one entry only. Please do not share it.', w)
  doc.text(lines, x, ty + 6)
  ty += 6 + lines.length * 4.6 + 4
  if (ticket.ticketUrl) {
    doc.setTextColor(122, 0, 25)
    doc.textWithLink('View this ticket online: ' + ticket.ticketUrl, x, ty, { url: ticket.ticketUrl })
  }
  // footer
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.line(x, MM.pageH - 18, MM.pageW - MM.margin, MM.pageH - 18)
  doc.setFontSize(7.5); doc.setTextColor(150, 150, 150)
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, x, MM.pageH - 12)
  doc.text(`Ticket ${ticket.ticketCode}`, MM.pageW - MM.margin, MM.pageH - 12, { align: 'right' })

  const blob = doc.output('blob')
  triggerDownload(blob, `Official-Ticket-${ticket.ticketCode}.pdf`)
}

/** Fetch an image through CORS and return a data: URL (so html2canvas can always draw it), or null. */
async function toDataUrl(src) {
  try {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => resolve(null)
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

/**
 * Save the ticket as a high-quality PNG (3x resolution, QR re-drawn from the 1024 px source so it scans
 * when printed or shown on a phone). Never navigates: it only triggers a file download.
 * @param {HTMLElement} ticketEl fixed-layout ticket (DigitalTicket variant="print")
 * @param {HTMLCanvasElement} qrHiRes 1024 px QR canvas for the same ticket
 */
export async function downloadTicketPng(ticketEl, qrHiRes, ticket) {
  const html2canvasMod = await import('html2canvas-pro')
  const html2canvas = html2canvasMod.default || html2canvasMod
  if (document.fonts?.ready) await document.fonts.ready

  // Cross-origin posters can taint the canvas: inline them first, and leave the poster out if that fails.
  const imgs = Array.from(ticketEl.querySelectorAll('img'))
  await Promise.all(imgs.map(async (img) => {
    if (!img.src || img.src.startsWith('data:')) return
    const data = await toDataUrl(img.src)
    if (data) {
      img.src = data
      if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r })
    } else if (img.hasAttribute('data-poster')) {
      img.style.display = 'none'
    }
  }))

  const SCALE = 3
  const shot = await html2canvas(ticketEl, {
    scale: SCALE, backgroundColor: '#FFFFFF', useCORS: true, logging: false,
    windowWidth: ticketEl.scrollWidth, windowHeight: ticketEl.scrollHeight,
    onclone: (doc) => doc.querySelectorAll('[data-ticket-qr] canvas').forEach((c) => { c.style.visibility = 'hidden' }),
  })

  const qrEl = ticketEl.querySelector('[data-ticket-qr]')
  if (qrEl && qrHiRes) {
    const tr = ticketEl.getBoundingClientRect()
    const qr = qrEl.getBoundingClientRect()
    const ctx = shot.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(qrHiRes, (qr.left - tr.left) * SCALE, (qr.top - tr.top) * SCALE, qr.width * SCALE, qr.height * SCALE)
  }

  return new Promise((resolve, reject) => {
    shot.toBlob((blob) => {
      if (!blob) return reject(new Error('Ticket image could not be created'))
      triggerDownload(blob, `Ticket-${ticket.ticketCode}.png`)
      resolve()
    }, 'image/png')
  })
}
