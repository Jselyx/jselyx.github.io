import { useEffect, useId, useMemo, useRef } from 'react'

// Радиальные профили форм M3 Expressive (как в Riff): r(t) в долях радиуса.
const N = 96
const PROFILES = {
  cookie: (t) => 0.9 + 0.08 * Math.cos(9 * t),
  clover: (t) => 0.8 + 0.18 * Math.cos(4 * t),
  flower: (t) => 0.86 + 0.12 * Math.cos(6 * t),
  sunny: (t) => 0.93 + 0.06 * Math.cos(12 * t),
  squircle: (t) => 0.84 * Math.pow(Math.abs(Math.cos(t)) ** 4 + Math.abs(Math.sin(t)) ** 4, -0.25),
  circle: () => 0.96,
}

const R = Object.fromEntries(
  Object.entries(PROFILES).map(([k, f]) => [k, Array.from({ length: N }, (_, i) => f((i / N) * Math.PI * 2))]),
)

const fx = (v) => v.toFixed(4)

// Catmull-Rom -> кубические Безье, замкнутый контур в viewBox 0 0 1 1
function toPath(r, rot) {
  const pts = new Array(N)
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rot
    pts[i] = [0.5 + 0.5 * r[i] * Math.cos(a), 0.5 + 0.5 * r[i] * Math.sin(a)]
  }
  let d = 'M' + fx(pts[0][0]) + ' ' + fx(pts[0][1])
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % N]
    const p3 = pts[(i + 2) % N]
    d +=
      'C' + fx(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + fx(p1[1] + (p2[1] - p0[1]) / 6) +
      ' ' + fx(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + fx(p2[1] - (p3[1] - p1[1]) / 6) +
      ' ' + fx(p2[0]) + ' ' + fx(p2[1])
  }
  return d + 'Z'
}

// Лёгкий перелёт в конце морфа — «желейное» ощущение
const C1 = 0.9
const ease = (t) => 1 + (C1 + 1) * Math.pow(t - 1, 3) + C1 * Math.pow(t - 1, 2)

const FULL = { x: 0, y: 0, width: 1, height: 1 }

export default function Morph({
  shapes = ['cookie'],
  spin = 0,
  hold = 2000,
  morph = 1250,
  className = '',
  image,
  imageBox = FULL,
  label,
}) {
  const svgRef = useRef(null)
  const pathRef = useRef(null)
  const rawId = useId()
  const id = 'morph-' + rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const key = shapes.join(',')
  const initial = useMemo(() => toPath(R[key.split(',')[0]] || R.circle, 0), [key])

  useEffect(() => {
    const svg = svgRef.current
    const path = pathRef.current
    if (!svg || !path) return undefined
    const list = key.split(',').map((s) => R[s] || R.circle)
    if (list.length < 2 && !spin) return undefined

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cur = new Float64Array(N)
    const cycle = hold + morph
    const total = cycle * list.length
    let raf = 0
    let visible = true
    let elapsed = 0
    let last = 0

    const draw = () => {
      const tt = elapsed % total
      const idx = Math.floor(tt / cycle)
      const local = tt - idx * cycle
      const from = list[idx]
      const to = list[(idx + 1) % list.length]
      const p = local < hold ? 0 : ease((local - hold) / morph)
      for (let i = 0; i < N; i++) cur[i] = from[i] + (to[i] - from[i]) * p
      path.setAttribute('d', toPath(cur, (elapsed / 1000) * spin))
    }
    const loop = (now) => {
      elapsed += Math.min(now - last, 64)
      last = now
      draw()
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const sync = () => {
      if (visible && !reduce.matches && !document.hidden) {
        if (!raf) {
          last = performance.now()
          raf = requestAnimationFrame(loop)
        }
      } else stop()
    }

    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      sync()
    })
    io.observe(svg)
    reduce.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      stop()
      io.disconnect()
      reduce.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [key, spin, hold, morph])

  return (
    <svg
      ref={svgRef}
      className={('morph ' + className).trim()}
      viewBox="0 0 1 1"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {image ? (
        <>
          <defs>
            <clipPath id={id}>
              <path ref={pathRef} d={initial} />
            </clipPath>
          </defs>
          <image
            href={image}
            x={imageBox.x}
            y={imageBox.y}
            width={imageBox.width}
            height={imageBox.height}
            preserveAspectRatio="xMidYMid slice"
            clipPath={'url(#' + id + ')'}
          />
        </>
      ) : (
        <path ref={pathRef} d={initial} className="morph-fill" />
      )}
    </svg>
  )
}
