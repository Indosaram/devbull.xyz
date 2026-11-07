// Generates components/charts/svg-data.json.
//
// Design rules for every figure (they are inlined as raw SVG strings, not React):
//   - 720-unit viewBox, height per figure; never leave unused vertical space.
//   - currentColor for text and neutrals so dark mode works without a second set.
//   - One accent (#db2777). Value labels sit next to their marks, not in a legend,
//     except where a legend is genuinely shorter than 9 direct labels.
//   - Every figure has a Korean (`id`) and English (`idEn`) variant.
import { writeFileSync } from 'node:fs'

const ACCENT = '#db2777'
const ACCENT_SOFT = '#f9a8d4'
const ACCENT_DEEP = '#9d174d'
const NEUTRAL = '#94a3b8'

const FONT = "'Space Grotesk',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const svg = (h, label, body) =>
  `<svg viewBox="0 0 720 ${h}" width="100%" role="img" aria-label="${esc(label)}" font-family="${FONT}">${body}</svg>`

const t = (x, y, str, o = {}) => {
  const { size = 12, weight = 400, anchor = 'start', fill = 'currentColor', opacity = 1 } = o
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${
    opacity === 1 ? '' : ` opacity="${opacity}"`
  }>${esc(str)}</text>`
}

const r = (x, y, w, h, o = {}) => {
  const { fill = ACCENT, opacity = 1, rx = 2 } = o
  return `<rect x="${round(x)}" y="${round(y)}" width="${round(Math.max(0, w))}" height="${round(
    h
  )}" rx="${rx}" fill="${fill}"${opacity === 1 ? '' : ` opacity="${opacity}"`}/>`
}

const ln = (x1, y1, x2, y2, o = {}) => {
  const { stroke = 'currentColor', width = 1, opacity = 1, dash = null } = o
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(
    y2
  )}" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"${
    dash ? ` stroke-dasharray="${dash}"` : ''
  }/>`
}

const dot = (cx, cy, rad, o = {}) => {
  const { fill = ACCENT, opacity = 1 } = o
  return `<circle cx="${round(cx)}" cy="${round(cy)}" r="${rad}" fill="${fill}"${
    opacity === 1 ? '' : ` opacity="${opacity}"`
  }/>`
}

const round = (n) => Math.round(n * 10) / 10

// ---------------------------------------------------------------- 1. cost
// One 100% stacked bar. The whole point is that the code segment is invisible,
// so the tail gets its own labelled row instead of an unreadable sliver.
function chartCost(L) {
  const H = 148
  const data = [
    { k: 'h', v: 74.7, fill: ACCENT, op: 1, inside: `${L.harnessShort} 74.7%` },
    { k: 's', v: 19.4, fill: '#64748b', op: 0.85, inside: '19.4%' },
    { k: 'o', v: 3.3, fill: NEUTRAL, op: 0.55 },
    { k: 'a', v: 1.4, fill: NEUTRAL, op: 0.4 },
    { k: 'c', v: 0.8, fill: ACCENT, op: 0.35 },
    { k: 'g', v: 0.5, fill: NEUTRAL, op: 0.25 },
  ]
  const total = data.reduce((s, d) => s + d.v, 0)
  const gap = 2
  const usable = 720 - gap * (data.length - 1)
  const scale = usable / total

  let x = 0
  let body = ''
  for (const [i, d] of data.entries()) {
    const w = d.v * scale
    body += r(x, 30, w, 46, { fill: d.fill, opacity: d.op, rx: 2 })
    if (d.k === 'h') body += t(x + 14, 60, d.inside, { size: 15, weight: 700, fill: '#fff' })
    if (d.k === 's')
      body += t(x + w - 10, 60, d.inside, { size: 13, weight: 700, fill: '#fff', anchor: 'end' })
    x += w + (i < data.length - 1 ? gap : 0)
  }

  const tail = [
    [L.toolOut, '3.3%'],
    [L.toolArgs, '1.4%'],
    [L.code, '0.8%'],
    [L.history, '0.5%'],
  ]
  tail.forEach(([name, val], i) => {
    const cx = i * 180
    body += r(cx, 96, 9, 9, {
      fill: i === 2 ? ACCENT : NEUTRAL,
      opacity: i === 2 ? 1 : 0.55,
      rx: 1,
    })
    body += t(cx + 15, 105, `${name} ${val}`, { size: 12, opacity: 0.85 })
  })
  body += t(0, 134, L.tailNote, { size: 11.5, opacity: 0.55 })
  return svg(H, L.costAria, body)
}

// ----------------------------------------------------------- 2. per-turn
// The point is accumulation, not proportion (chart 1 already covers proportion).
// Over 20 turns the harness charge climbs linearly to 1,494 while code stays
// at 0.8. Plotting the cumulative sum makes that divergence the shape.
function chartPerTurn(L) {
  const H = 210
  const x0 = 64
  const x1 = 676
  const yBase = 158
  const yTop = 44
  const perTurnHarness = 74.7
  const perTurnCode = 0.8
  const maxY = perTurnHarness * 20
  const px = (turn) => x0 + ((turn - 1) / 19) * (x1 - x0)
  const py = (v) => yBase - (v / maxY) * (yBase - yTop)

  let body = t(0, 16, L.perTurnTitle, { size: 14, weight: 700 })
  body += t(0, 32, L.perTurnNote, { size: 11.5, opacity: 0.55 })

  for (const turn of [1, 5, 10, 15, 20]) {
    body += ln(px(turn), yTop - 6, px(turn), yBase, { opacity: 0.1 })
    body += t(px(turn), yBase + 18, String(turn), { size: 11, anchor: 'middle', opacity: 0.5 })
  }

  body += ln(x0, yBase + 0.5, x1, yBase + 0.5, { opacity: 0.35 })

  const harnessPts = Array.from(
    { length: 20 },
    (_, i) => `${round(px(i + 1))},${round(py(perTurnHarness * (i + 1)))}`
  )
  const codePts = Array.from(
    { length: 20 },
    (_, i) => `${round(px(i + 1))},${round(py(perTurnCode))}`
  )

  body += `<path d="M ${round(px(1))},${yBase} L ${harnessPts.join(' L ')} L ${round(px(20))},${yBase} Z" fill="${ACCENT}" opacity="0.14"/>`
  body += `<polyline points="${harnessPts.join(' ')}" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>`
  body += `<polyline points="${codePts.join(' ')}" fill="none" stroke="currentColor" stroke-width="2" opacity="0.55"/>`

  body += dot(px(20), py(maxY), 4, { fill: ACCENT })
  body += t(px(20) - 10, py(maxY) - 8, '1,494', {
    size: 13,
    weight: 700,
    anchor: 'end',
    fill: ACCENT,
  })
  body += t(px(20) - 10, py(maxY) + 10, L.harnessCum, { size: 11.5, anchor: 'end', opacity: 0.75 })

  body += dot(px(20), py(perTurnCode), 3.5, { fill: 'currentColor', opacity: 0.7 })
  body += t(px(9), py(perTurnCode) - 10, L.codeCum, { size: 11.5, opacity: 0.7 })

  body += t(720, yBase + 18, L.turnAxis, { size: 11, anchor: 'end', opacity: 0.5 })
  body += t(0, 200, L.perTurnFootnote, { size: 11, opacity: 0.5 })
  return svg(H, L.perTurnAria, body)
}

// -------------------------------------------------------------- 3. turns
function chartTurns(L) {
  const H = 238
  const x = (turn) => 90 + (turn - 6) * 100
  let body = ''

  for (let turn = 6; turn <= 12; turn++) {
    body += ln(x(turn), 30, x(turn), 122, { opacity: 0.16 })
    body += t(x(turn), 22, String(turn), { size: 11, anchor: 'middle', opacity: 0.5 })
  }

  const rows = [
    { label: L.repo7, y: 54, vals: [7, 9, 11, 11], mean: 9.5, fill: NEUTRAL, op: 0.75 },
    { label: L.repo202, y: 100, vals: [10, 10, 11, 11], mean: 10.5, fill: ACCENT, op: 0.95 },
  ]

  for (const row of rows) {
    body += t(0, row.y + 4, row.label, { size: 12, opacity: 0.75 })
    const seen = {}
    for (const v of row.vals) {
      seen[v] = (seen[v] || 0) + 1
      const stack = seen[v] - 1
      body += dot(x(v), row.y - stack * 13, 6.5, { fill: row.fill, opacity: row.op })
    }
    const mx = x(row.mean)
    body += `<path d="M ${round(mx)} ${row.y - 6} L ${round(mx + 6)} ${row.y} L ${round(
      mx
    )} ${row.y + 6} L ${round(mx - 6)} ${row.y} Z" fill="currentColor" opacity="0.85"/>`
    body += t(mx, row.y - 14, L.mean + ' ' + row.mean.toFixed(1), {
      size: 11.5,
      weight: 700,
      anchor: 'middle',
      opacity: 0.85,
    })
  }

  // difference scale: label the interval ends with the real bounds, because
  // "includes zero" is the whole claim and -2/+4 are not the numbers.
  const dScale = (d) => 360 + d * 60
  body += t(0, 168, L.diffLabel, { size: 12, weight: 700, opacity: 0.85 })
  body += ln(dScale(-2), 180, dScale(4), 180, { opacity: 0.25, width: 5 })
  body += ln(dScale(-1.92), 171, dScale(-1.92), 189, { opacity: 0.7, width: 1.5 })
  body += ln(dScale(3.92), 171, dScale(3.92), 189, { opacity: 0.7, width: 1.5 })
  body += ln(dScale(0), 170, dScale(0), 191, { opacity: 0.5 })
  body += dot(dScale(1), 180, 5.5, { fill: ACCENT })
  body += t(dScale(1), 204, '+1.0', { size: 11.5, weight: 700, anchor: 'middle', fill: ACCENT })
  body += t(dScale(1), 218, L.observed, { size: 10.5, anchor: 'middle', opacity: 0.5 })
  body += t(dScale(-1.92) - 6, 204, '-1.92', { size: 11, anchor: 'end', opacity: 0.6 })
  body += t(dScale(3.92) + 6, 204, '+3.92', { size: 11, opacity: 0.6 })
  body += t(dScale(0), 218, '0', { size: 10.5, anchor: 'middle', opacity: 0.5 })
  body += t(720, 168, L.ciLabel, { size: 11, anchor: 'end', opacity: 0.6 })
  return svg(H, L.turnsAria, body)
}

// -------------------------------------------------------------- 4. cache
// Eight runs crammed into a 9-point band cannot be a dot plot: the labels
// collide. One bar with the observed range as a band reads faster anyway,
// because the claim is "about half", not "here are eight numbers".
function chartCache(L) {
  const H = 170
  const x = (v) => (v / 100) * 720
  const lo = 50.6
  const hi = 59.7
  const agg = 54.5
  let body = ''

  body += r(0, 40, 720, 52, { fill: 'currentColor', opacity: 0.12, rx: 2 })
  body += r(x(agg), 40, x(hi) - x(agg), 52, { fill: ACCENT, opacity: 0.2 })
  body += r(0, 40, x(agg), 52, { fill: ACCENT, opacity: 0.9, rx: 2 })

  body += t(x(agg) - 12, 73, agg + '%', { size: 17, weight: 700, anchor: 'end', fill: '#fff' })
  body += t((x(hi) + 720) / 2, 73, L.cacheRest, { size: 12.5, anchor: 'middle', opacity: 0.75 })

  body += ln(x(lo), 34, x(lo), 100, { opacity: 0.55 })
  body += ln(x(hi), 34, x(hi), 100, { opacity: 0.55 })
  body += t(x(lo), 26, lo + '%', { size: 11, anchor: 'middle', opacity: 0.7 })
  body += t(x(hi), 26, hi + '%', { size: 11, anchor: 'middle', opacity: 0.7 })
  body += t(x(agg), 120, L.cacheRange, { size: 11.5, anchor: 'middle', opacity: 0.6 })

  for (const v of [0, 25, 50, 75, 100]) {
    body += t(x(v), 158, v + '%', {
      size: 11,
      anchor: v === 0 ? 'start' : v === 100 ? 'end' : 'middle',
      opacity: 0.4,
    })
  }
  return svg(H, L.cacheAria, body)
}

// ------------------------------------------------------------ 5. paradox
function chartParadox(L) {
  const H = 170
  const zero = 300
  const per = 5.2
  const y = 58
  const h = 42
  let body = ''

  body += t(zero - 17 * per - 12, y - 12, L.tokens, {
    size: 12,
    weight: 700,
    anchor: 'end',
    opacity: 0.85,
  })
  body += t(zero + 67 * per + 12, y - 12, L.cost, { size: 12, weight: 700, opacity: 0.85 })

  body += r(zero - 17 * per, y, 17 * per, h, { fill: NEUTRAL, opacity: 0.5, rx: 2 })
  body += t(zero - 8, y + h / 2 + 5, '-17%', {
    size: 15,
    weight: 700,
    anchor: 'end',
    opacity: 0.85,
  })
  body += r(zero, y, 67 * per, h, { fill: ACCENT, opacity: 0.92, rx: 2 })
  body += t(zero + 8, y + h / 2 + 5, '+67%', { size: 15, weight: 700, fill: '#fff' })

  body += ln(zero, y - 8, zero, y + h + 10, { opacity: 0.4, width: 1.5 })
  body += t(zero, y + h + 30, '0', { size: 11, anchor: 'middle', opacity: 0.5 })
  body += t(0, 152, L.paradoxNote, { size: 12, opacity: 0.6 })
  return svg(H, L.paradoxAria, body)
}

// ---------------------------------------------------------------- 6. lang
function chartLang(L) {
  const H = 116
  let body = ''
  body += r(0, 22, 115.2, 50, { fill: ACCENT, opacity: 0.92, rx: 2 })
  body += r(115.2, 22, 604.8, 50, { fill: NEUTRAL, opacity: 0.3, rx: 2 })
  body += t(57.6, 54, '16%', { size: 15, weight: 700, anchor: 'middle', fill: '#fff' })
  body += t(417.6, 55, '84%', { size: 16, weight: 700, anchor: 'middle', opacity: 0.85 })
  body += t(0, 94, L.langLabel, { size: 12, weight: 700, fill: ACCENT })
  body += t(720, 94, L.otherLabel, { size: 12, anchor: 'end', opacity: 0.65 })
  return svg(H, L.langAria, body)
}

// ------------------------------------------------------------ 7. langmult
function chartLangmult(L) {
  const H = 320
  const x = (v) => 72 + v * 362
  const models = [
    { key: 'gemma', name: 'Gemma', fill: ACCENT_SOFT, op: 1 },
    { key: 'qwen', name: 'Qwen', fill: ACCENT, op: 1 },
    { key: 'glm', name: 'GLM', fill: ACCENT_DEEP, op: 1 },
  ]
  const groups = [
    { name: 'Java', vals: [0.85, 1.21, 1.34], ns: [false, false, false] },
    { name: 'Rust', vals: [1.07, 1.2, 1.57], ns: [true, false, false] },
    { name: 'OCaml', vals: [1.44, 1.69, 1.54], ns: [false, false, false] },
  ]
  let body = ''

  models.forEach((m, i) => {
    const lx = i * 150
    body += r(lx, 10, 10, 10, { fill: m.fill, opacity: m.op, rx: 2 })
    body += t(lx + 16, 19, m.name, { size: 12, opacity: 0.85 })
  })

  body += ln(x(1), 36, x(1), 286, { stroke: ACCENT, opacity: 0.5, dash: '4 4', width: 1.5 })
  body += t(x(1), 32, 'Python 1.00×', { size: 11, anchor: 'middle', opacity: 0.75, fill: ACCENT })

  groups.forEach((g, gi) => {
    const top = 48 + gi * 84
    body += t(0, top + 32, g.name, { size: 13, weight: 700 })
    g.vals.forEach((v, i) => {
      const by = top + i * 26
      body += r(72, by, x(v) - 72, 20, { fill: models[i].fill, opacity: models[i].op, rx: 2 })
      body += t(x(v) + 8, by + 15, v.toFixed(2) + '×' + (g.ns[i] ? ' ' + L.ns : ''), {
        size: 11.5,
        weight: 600,
        opacity: 0.9,
      })
    })
  })

  body += t(0, 314, L.langmultNote, { size: 11, opacity: 0.55 })
  return svg(H, L.langmultAria, body)
}

// ------------------------------------------------------------------ copy
const KO = {
  harnessShort: '하네스',
  toolOut: '툴 출력',
  toolArgs: '툴 인자',
  code: '코드',
  history: '대화',
  tailNote: '나머지 네 항목을 전부 합쳐도 6.0%입니다. 막대 폭은 비용 비중에 비례합니다.',
  costAria:
    '에이전트 청구서 구성: 하네스 74.7퍼센트, 숨은 사고 19.4퍼센트, 툴 출력 3.3퍼센트, 툴 인자 1.4퍼센트, 코드 0.8퍼센트, 대화 0.5퍼센트',
  perTurnTitle: '같은 프롬프트가 턴마다 다시 올라간다',
  turnAxis: '턴',
  perTurnNote: '턴을 거듭할수록 누적 청구액이 벌어집니다. 같은 프롬프트가 매 턴 다시 청구되니까요.',
  harnessCum: '하네스 누적',
  codeCum: '코드 누적 0.8%',
  perTurnFootnote: '한 턴 청구액을 1로 놓고 20턴까지 누적한 값. 단위: 턴당 비용의 배수.',
  perTurnAria: '20턴 누적 청구액. 하네스는 매 턴 반복되어 1,494까지 오르고, 코드는 0.8에 머문다',
  repo7: '7파일',
  repo202: '202파일',
  mean: '평균',
  diffLabel: '차이 (202 − 7)',
  observed: '관측값',
  noDiff: '차이 없음',
  ciLabel: '95% 신뢰구간',
  turnsAria:
    '순차 실행 8회의 턴 수 분포. 7파일 7~11턴 평균 9.5, 202파일 10~11턴 평균 10.5, 차이의 95퍼센트 신뢰구간이 0을 포함한다',
  total: '전체',
  cacheRange: '관측 범위 50.6~59.7% (8회)',
  cacheRest: '나머지 45.5%',
  cacheNote: '점 하나가 실행 1회입니다. 점선은 8회 합계 54.5%.',
  cacheAria: '청구 토큰 중 캐시 읽기 비중 54.5퍼센트. 8회 실행의 범위는 50.6에서 59.7퍼센트',
  tokens: '입력 토큰',
  cost: '세션 비용',
  paradoxNote: '입력 토큰은 17% 줄었는데 세션 비용은 67% 늘었습니다.',
  paradoxAria: '입력 토큰 17퍼센트 감소, 세션 비용 67퍼센트 증가',
  langLabel: '← 언어 16%',
  otherLabel: '모델 · 과제 · 프롬프트 84% →',
  langAria: '언어가 설명하는 성능 분산은 16퍼센트, 나머지 84퍼센트는 모델과 과제와 프롬프트',
  ns: 'n.s.',
  langmultNote: 'OCaml은 세 모델 모두 p<0.001. Python 대비 토큰 배수, 2,000 궤적.',
  langmultAria:
    'Python 대비 토큰 배수. Java 0.85에서 1.34, Rust 1.07에서 1.57, OCaml 1.44에서 1.69',
}

const EN = {
  harnessShort: 'Harness',
  toolOut: 'Tool output',
  toolArgs: 'Tool args',
  code: 'Code',
  history: 'History',
  tailNote: 'All four together are 6.0% of the bill. Bar widths are proportional to cost share.',
  costAria:
    'Agent bill composition: harness 74.7 percent, hidden thinking 19.4, tool output 3.3, tool args 1.4, code 0.8, history 0.5',
  perTurnTitle: 'The same prompt is billed again every turn',
  turnAxis: 'turn',
  perTurnNote:
    'The gap widens with every turn, because the same prompt is charged again each time.',
  harnessCum: 'harness, cumulative',
  codeCum: 'code, still 0.8% after 20 turns',
  perTurnFootnote: 'Cumulative bill out to 20 turns, with one turn normalized to 1.',
  perTurnAria:
    'Cumulative bill over 20 turns: the harness repeats every turn and climbs to 1,494 while code stays at 0.8',
  repo7: '7 files',
  repo202: '202 files',
  mean: 'mean',
  diffLabel: 'Difference (202 − 7)',
  observed: 'observed',
  noDiff: 'no difference',
  ciLabel: '95% CI',
  turnsAria:
    'Turn-count distribution over 8 sequential runs. 7 files 7-11 turns, mean 9.5; 202 files 10-11 turns, mean 10.5; the 95 percent confidence interval includes zero',
  total: 'Total',
  cacheRange: 'Observed range 50.6–59.7% over 8 runs',
  cacheRest: 'the other 45.5%',
  cacheNote: 'One dot per run. The dashed line is the 8-run total, 54.5%.',
  cacheAria:
    'Cache reads are 54.5 percent of billed tokens, ranging from 50.6 to 59.7 percent over 8 runs',
  tokens: 'Input tokens',
  cost: 'Session cost',
  paradoxNote: 'Input tokens fell 17%. The session bill rose 67%.',
  paradoxAria: 'Input tokens down 17 percent, session cost up 67 percent',
  langLabel: '← language 16%',
  otherLabel: 'model · task · prompt 84% →',
  langAria:
    'Language explains 16 percent of performance variance; 84 percent is model, task and prompt',
  ns: 'n.s.',
  langmultNote:
    'OCaml is p<0.001 on all three models. Token multiplier vs Python, 2,000 trajectories.',
  langmultAria:
    'Token multiplier vs Python. Java 0.85 to 1.34, Rust 1.07 to 1.57, OCaml 1.44 to 1.69',
}

const out = {
  cost: chartCost(KO),
  perTurn: chartPerTurn(KO),
  turns: chartTurns(KO),
  cache: chartCache(KO),
  paradox: chartParadox(KO),
  lang: chartLang(KO),
  langmult: chartLangmult(KO),
  costEn: chartCost(EN),
  perTurnEn: chartPerTurn(EN),
  turnsEn: chartTurns(EN),
  cacheEn: chartCache(EN),
  paradoxEn: chartParadox(EN),
  langEn: chartLang(EN),
  langmultEn: chartLangmult(EN),
}

writeFileSync('components/charts/svg-data.json', JSON.stringify(out, null, 2) + '\n')
console.log('wrote', Object.keys(out).length, 'figures:', Object.keys(out).join(', '))
