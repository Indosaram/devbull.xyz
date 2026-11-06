// Generates the SVG figures injected by components/charts/Chart.tsx.
// Every number here mirrors an audited value in
// research/2026-11-05-ai-native-programming-languages/REPORT.md
import fs from 'node:fs'

const ACCENT = '#db2777'
const SLATE = '#94a3b8'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const svg = (h, label, body) =>
  `<svg viewBox="0 0 720 ${h}" width="100%" role="img" aria-label="${esc(label)}">${body}</svg>`

const round = (n) => Math.round(n * 10) / 10

// ---------------------------------------------------------------- paradox
// arXiv 2604.07502: input tokens -17%, total session cost +67%.
function paradox() {
  const H = 172
  const zero = 360
  const pxPerPct = 330 / 70
  const out = []
  out.push(
    `<line x1="${zero}" y1="30" x2="${zero}" y2="150" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>`
  )
  // row 1 — savings
  out.push(`<text x="2" y="42" font-size="12.5" fill="currentColor" opacity="0.8">입력 토큰</text>`)
  const w1 = 17 * pxPerPct
  out.push(
    `<rect x="${round(zero - w1)}" y="50" width="${round(w1)}" height="32" rx="3" fill="${SLATE}" opacity="0.55"/>`
  )
  out.push(
    `<text x="${round(zero - w1 - 8)}" y="72" text-anchor="end" font-size="16" font-weight="700" fill="currentColor" opacity="0.85">−17%</text>`
  )
  // row 2 — cost
  out.push(
    `<text x="2" y="118" font-size="12.5" fill="currentColor" opacity="0.8">세션 총비용</text>`
  )
  const w2 = 67 * pxPerPct
  out.push(
    `<rect x="${zero}" y="126" width="${round(w2)}" height="32" rx="3" fill="${ACCENT}" opacity="0.92"/>`
  )
  out.push(
    `<text x="${round(zero + w2 - 10)}" y="148" text-anchor="end" font-size="16" font-weight="700" fill="#fff">+67%</text>`
  )
  // axis ticks
  out.push(
    `<text x="${round(zero - 70 * pxPerPct)}" y="168" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.5">−70%</text>`
  )
  out.push(
    `<text x="${zero}" y="168" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.5">0</text>`
  )
  out.push(
    `<text x="${round(zero + 70 * pxPerPct)}" y="168" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.5">+70%</text>`
  )
  return svg(
    H,
    '압축의 역설: 입력 토큰은 17퍼센트 줄었지만 세션 총비용은 67퍼센트 늘었다',
    out.join('')
  )
}

// -------------------------------------------------------------- langmult
// arXiv 2607.22807: token multiplier vs Python, 5 models x 4 languages x 100 tasks.
const LANG = [
  {
    name: 'Java',
    v: [
      ['Gemma', 0.85],
      ['Qwen', 1.21],
      ['GLM', 1.34],
    ],
  },
  {
    name: 'Rust',
    v: [
      ['Gemma', 1.07],
      ['Qwen', 1.2],
      ['GLM', 1.57],
    ],
  },
  {
    name: 'OCaml',
    v: [
      ['Gemma', 1.44],
      ['Qwen', 1.69],
      ['GLM', 1.54],
    ],
  },
]
const MODEL_FILL = { Gemma: '#f9a8d4', Qwen: ACCENT, GLM: '#9d174d' }
const NSW = { 'Rust/Gemma': true }

function langmult() {
  const H = 296
  const x0 = 110
  const unit = 330 // px per 1.0x
  const out = []
  // python baseline
  const baseX = round(x0 + unit)
  out.push(
    `<line x1="${baseX}" y1="26" x2="${baseX}" y2="${H - 26}" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.45"/>`
  )
  out.push(
    `<text x="${baseX}" y="${H - 8}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.55">Python = 1.00×</text>`
  )
  // legend
  let lx = 470
  for (const m of ['Gemma', 'Qwen', 'GLM']) {
    out.push(`<rect x="${lx}" y="8" width="10" height="10" rx="2" fill="${MODEL_FILL[m]}"/>`)
    out.push(
      `<text x="${lx + 15}" y="17" font-size="11.5" fill="currentColor" opacity="0.75">${m}</text>`
    )
    lx += 84
  }
  let y = 40
  for (const g of LANG) {
    out.push(
      `<text x="2" y="${y - 4}" font-size="12.5" font-weight="700" fill="currentColor" opacity="0.85">${g.name}</text>`
    )
    for (const [model, val] of g.v) {
      const w = round(val * unit)
      out.push(
        `<rect x="${x0}" y="${y + 4}" width="${w}" height="18" rx="2" fill="${MODEL_FILL[model]}"/>`
      )
      const nsw = NSW[`${g.name}/${model}`] ? ' n.s.' : ''
      out.push(
        `<text x="${x0 + w + 7}" y="${y + 17}" font-size="11.5" font-weight="600" fill="currentColor" opacity="0.8">${val.toFixed(2)}×${nsw}</text>`
      )
      y += 22
    }
    y += 16
  }
  out.push(
    `<text x="2" y="${H - 8}" font-size="11" fill="currentColor" opacity="0.55">OCaml은 세 모델 모두 p&lt;0.001</text>`
  )
  return svg(
    H,
    'Python 대비 토큰 배수: Java 0.85~1.34배, Rust 1.07~1.57배, OCaml 1.44~1.69배',
    out.join('')
  )
}

// ---------------------------------------------------------------- render
const file = 'components/charts/svg-data.json'
const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const next = { ...data, paradox: paradox(), langmult: langmult() }
fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n')

console.log('wrote', Object.keys(next).join(', '))
console.log('paradox px:', 'neg', round(17 * (330 / 70)), 'pos', round(67 * (330 / 70)))
for (const g of LANG)
  for (const [m, v] of g.v) console.log(`  ${g.name}/${m}: ${v}× -> ${v.toFixed(2)}`)
