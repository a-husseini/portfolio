// Draws the fortune on this device. A booth fortune arrives after the # in the link,
// which browsers never send to any server. No link data? Draw one from fortunes.json.
;(() => {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const FONT = '"IBM Plex Mono", ui-monospace, Consolas, monospace'
  const PORTFOLIO = 'amir-icstars.github.io'
  const W = 640
  const SCALE = 2
  let canvas
  let lastIndex = -1

  const short = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')

  function fromLink() {
    try {
      const b64 = location.hash.slice(1).replace(/-/g, '+').replace(/_/g, '/')
      if (!b64) return null
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const [text, number, language, name, booth, date] = JSON.parse(new TextDecoder().decode(bytes))
      const f = {
        text: short(text, 340),
        number,
        language: short(language, 20),
        name: short(name, 20),
        booth: short(booth, 40),
        date: short(date, 24),
      }
      const ok = f.text && f.language && Number.isInteger(number) && number >= 1 && number <= 99
      return ok && !/https?:|www\./i.test(f.text + f.name + f.booth) ? f : null
    } catch {
      return null
    }
  }

  async function random(name) {
    const list = await (await fetch('fortunes.json')).json()
    let i
    do i = Math.floor(Math.random() * list.length)
    while (i === lastIndex && list.length > 1)
    lastIndex = i
    const f = list[i]
    return {
      text: f.fortune,
      number: f.lucky_number,
      language: f.lucky_language,
      name: short(name, 20),
      booth: '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  }

  function wrap(ctx, text, width) {
    const lines = []
    let line = ''
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > width) {
        lines.push(line)
        line = word
      } else line = next
    }
    return line ? [...lines, line] : lines
  }

  function draw(f, qr) {
    const tall = document.createElement('canvas')
    tall.width = W * SCALE
    tall.height = 2400 * SCALE
    const ctx = tall.getContext('2d')
    ctx.scale(SCALE, SCALE)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, 2400)
    ctx.fillStyle = ctx.strokeStyle = '#000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    let y = 40

    const text = (s, size, weight, after = 0, lead = 1.3) => {
      ctx.font = `${weight} ${size}px ${FONT}`
      for (const line of wrap(ctx, s, W - 80)) {
        ctx.fillText(line, W / 2, y)
        y += size * lead
      }
      y += after
    }
    const divider = () => {
      for (let x = 32; x < W - 32; x += 14) ctx.fillRect(x, y, 8, 3)
      y += 24
    }

    ctx.save()
    ctx.translate(W / 2 - 64, y)
    ctx.scale(2, 2)
    ctx.lineWidth = 3.2
    ctx.lineCap = 'square'
    ctx.stroke(new Path2D('M4 58 L20 6 L36 58 M44 6 V58 M60 6 V58 M11 36 H60'))
    ctx.restore()
    y += 148

    text('TECH FORTUNE', 44, 600, 16)
    if (f.name) text(`A fortune for ${f.name}`, 32, 600, 14)
    divider()
    text(f.text, 32, 400, 18, 1.35)
    divider()
    text(`Lucky number: ${f.number}`, 32, 600, 4)
    text(`Lucky language: ${f.language}`, 32, 600, 18)
    divider()
    text('Built by Amir Husseini', 29, 600)
    text('Full-stack developer', 27, 400, 8)
    if (qr) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(qr, W / 2 - 125, y, 250, 250)
      y += 256
    }
    text(PORTFOLIO, 25, 400, 18)
    text(f.booth ? `${f.date} | ${f.booth}` : f.date, 25, 400)

    const out = document.createElement('canvas')
    out.width = W * SCALE
    out.height = Math.round((y + 36) * SCALE)
    out.getContext('2d').drawImage(tall, 0, 0)
    return out
  }

  const toBlob = (type) => new Promise((done) => canvas.toBlob(done, type, 0.95))

  // One JPEG on one 80 mm wide page: small enough to write by hand, so no PDF library.
  async function toPdf() {
    const jpeg = new Uint8Array(await (await toBlob('image/jpeg')).arrayBuffer())
    const w = 226.77
    const h = ((w * canvas.height) / canvas.width).toFixed(2)
    const content = `q ${w} 0 0 ${h} 0 0 cm /I Do Q`
    const objects = [
      ['<</Type/Catalog/Pages 2 0 R>>'],
      ['<</Type/Pages/Kids[3 0 R]/Count 1>>'],
      [`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${w} ${h}]/Resources<</XObject<</I 4 0 R>>>>/Contents 5 0 R>>`],
      [
        `<</Type/XObject/Subtype/Image/Width ${canvas.width}/Height ${canvas.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`,
        jpeg,
        '\nendstream',
      ],
      [`<</Length ${content.length}>>\nstream\n${content}\nendstream`],
    ]
    const parts = []
    let size = 0
    const add = (p) => {
      parts.push(p)
      size += p.length // every string here is ASCII
    }
    add('%PDF-1.4\n')
    const offsets = objects.map((body, i) => {
      const at = size
      add(`${i + 1} 0 obj\n`)
      body.forEach(add)
      add('\nendobj\n')
      return at
    })
    const xref = size
    add(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`)
    offsets.forEach((o) => add(`${String(o).padStart(10, '0')} 00000 n \n`))
    add(`trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`)
    return new Blob(parts, { type: 'application/pdf' })
  }

  function save(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  function loadQr() {
    return new Promise((done) => {
      const img = new Image()
      img.onload = () => done(img)
      img.onerror = () => done(null)
      img.src = 'portfolio-qr.png'
    })
  }

  async function show(f) {
    const [qr] = await Promise.all([
      loadQr(),
      ...[400, 600].map((w) => document.fonts.load(`${w} 32px "IBM Plex Mono"`).catch(() => {})),
    ])
    canvas = draw(f, qr)
    $('receipt').src = canvas.toDataURL('image/png')
    $('receipt').alt = `${f.text} Lucky number ${f.number}. Lucky language ${f.language}.`
    $('draw').hidden = true
    $('result').hidden = false
    scrollTo(0, 0)
  }

  const ask = () => {
    $('result').hidden = true
    $('draw').hidden = false
  }

  $('draw').addEventListener('submit', async (e) => {
    e.preventDefault()
    await show(await random($('name').value))
  })
  $('again').addEventListener('click', async () => {
    const name = $('name').value || (fromLink() || {}).name
    await show(await random(name))
  })
  $('png').addEventListener('click', async () => save(await toBlob('image/png'), 'tech-fortune.png'))
  $('pdf').addEventListener('click', async () => save(await toPdf(), 'tech-fortune.pdf'))

  const probe = new File([''], 'x.png', { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [probe] })) {
    $('share').hidden = false
    $('share').addEventListener('click', async () => {
      const file = new File([await toBlob('image/png')], 'tech-fortune.png', { type: 'image/png' })
      navigator.share({ files: [file] }).catch(() => {})
    })
  }

  const open = () => {
    const f = fromLink()
    if (f) show(f)
    else ask()
  }
  addEventListener('hashchange', open)
  open()
})()
