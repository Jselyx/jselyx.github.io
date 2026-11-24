import { useEffect } from 'react'

// Пошаговый скролл по экранам с накоплением. Колесо, тачпад, свайп и клавиши сначала
// «натягивают» страницу (--pull), а после порога она плавно переезжает к соседнему экрану.
// Если экран выше окна, внутри него прокрутка обычная, пока не упрёшься в край.
const WHEEL_THRESHOLD = 110
const TOUCH_THRESHOLD = 64
const RESET_MS = 220
const LOCK_MS = 850
const LOCK_MAX_MS = 1800
const EDGE = 8
const SKIP = 'input, textarea, select, [contenteditable="true"], [data-native-scroll]'

export default function useSectionSnap(onActive) {
  useEffect(() => {
    const root = document.documentElement
    const sections = Array.from(document.querySelectorAll('[data-snap]'))
    if (!sections.length) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let accumulated = 0
    let resetTimer = 0
    let lockedUntil = 0
    let snapStarted = 0
    let touch = null
    let frame = 0
    let lastActive = -1

    const now = () => performance.now()
    const isLocked = () => now() < lockedUntil
    const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight)
    const pageTop = (section) => section.getBoundingClientRect().top + window.scrollY
    const topOf = (i) => Math.min(maxScroll(), Math.max(0, Math.round(pageTop(sections[i]))))
    const bottomOf = (i) => Math.min(maxScroll(), Math.max(topOf(i), Math.round(pageTop(sections[i]) + sections[i].offsetHeight - window.innerHeight)))
    const activeIndex = () => {
      if (window.scrollY >= maxScroll() - 2) return sections.length - 1
      const anchor = window.scrollY + window.innerHeight * 0.4
      return sections.reduce((current, section, i) => (pageTop(section) <= anchor ? i : current), 0)
    }

    // Куда ехать при жесте в направлении delta; null — отдать прокрутку браузеру.
    const destination = (delta) => {
      const i = activeIndex()
      const y = window.scrollY
      const top = topOf(i)
      const bottom = bottomOf(i)
      let target = null
      if (delta > 0) {
        if (y < top - EDGE) target = top
        else if (y < bottom - EDGE) return null
        else if (i < sections.length - 1) target = topOf(i + 1)
      } else if (y > bottom + EDGE) target = bottom
      else if (y > top + EDGE) return null
      else if (i > 0) target = bottomOf(i - 1)
      return target === null || Math.abs(target - y) < 2 ? null : target
    }

    const setPull = (value) => {
      const v = Math.max(-1, Math.min(1, value))
      root.style.setProperty('--pull', v.toFixed(3))
      root.style.setProperty('--pull-abs', Math.abs(v).toFixed(3))
    }
    const reset = () => { accumulated = 0; setPull(0) }
    const snap = (top) => {
      clearTimeout(resetTimer)
      reset()
      snapStarted = now()
      lockedUntil = snapStarted + LOCK_MS
      window.scrollTo({ top, behavior: 'smooth' })
    }
    // Инерция тачпада продолжает слать события после перехода — держим замок, пока она не стихнет.
    const holdLock = () => { if (now() - snapStarted < LOCK_MAX_MS) lockedUntil = Math.max(lockedUntil, now() + 160) }
    const skip = (event) => reduced.matches || event.ctrlKey || event.metaKey || event.altKey || Boolean(event.target?.closest?.(SKIP))

    const onWheel = (event) => {
      if (skip(event)) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
      if (Math.abs(delta) < 2 || Math.abs(event.deltaX) > Math.abs(delta) * 1.4) return
      if (isLocked()) { if (event.cancelable) event.preventDefault(); holdLock(); return }
      const target = destination(delta)
      if (target === null) { if (accumulated) reset(); return }
      if (event.cancelable) event.preventDefault()
      if (Math.sign(accumulated) !== Math.sign(delta)) accumulated = 0
      accumulated += delta
      setPull(accumulated / WHEEL_THRESHOLD)
      clearTimeout(resetTimer)
      resetTimer = setTimeout(reset, RESET_MS)
      if (Math.abs(accumulated) >= WHEEL_THRESHOLD) snap(target)
    }

    const onTouchStart = (event) => {
      if (skip(event) || event.touches.length !== 1) { touch = null; return }
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, dir: 0, target: null }
    }
    const onTouchMove = (event) => {
      if (!touch) return
      if (event.touches.length !== 1) { touch = null; reset(); return }
      const dy = touch.y - event.touches[0].clientY
      const dx = touch.x - event.touches[0].clientX
      if (!touch.dir) {
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return
        if (Math.abs(dx) > Math.abs(dy)) { touch = null; return }
        touch.dir = Math.sign(dy)
        touch.target = isLocked() ? 'locked' : destination(dy)
        if (touch.target === null) { touch = null; return }
      }
      if (event.cancelable) event.preventDefault()
      if (touch.target !== 'locked') setPull(Math.sign(dy) === touch.dir ? dy / TOUCH_THRESHOLD : 0)
    }
    const onTouchEnd = (event) => {
      if (!touch) return
      const gesture = touch
      touch = null
      reset()
      const point = event.changedTouches[0]
      if (!point || !gesture.dir || gesture.target === 'locked' || gesture.target === null) return
      const dy = gesture.y - point.clientY
      if (Math.sign(dy) === gesture.dir && Math.abs(dy) >= TOUCH_THRESHOLD && !isLocked()) snap(gesture.target)
    }
    const onTouchCancel = () => { touch = null; reset() }

    const onKey = (event) => {
      if (event.defaultPrevented || skip(event)) return
      const space = event.key === ' '
      if (space && event.target?.closest?.('button, [role="button"]')) return
      const down = event.key === 'ArrowDown' || event.key === 'PageDown' || (space && !event.shiftKey)
      const up = event.key === 'ArrowUp' || event.key === 'PageUp' || (space && event.shiftKey)
      if (!down && !up) return
      const target = destination(down ? 1 : -1)
      if (target === null) return
      event.preventDefault()
      if (!isLocked()) snap(target)
    }

    const update = () => {
      frame = 0
      const i = activeIndex()
      if (i !== lastActive) { lastActive = i; onActive?.(i) }
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
      clearTimeout(resetTimer)
      reset()
    }
  }, [onActive])
}
