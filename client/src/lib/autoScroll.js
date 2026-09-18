/**
 * Smoothly scrolls the page down at `speed` px/s until the bottom is reached
 * or the guest takes over (touch, wheel, keyboard, drag on the scrollbar).
 * Returns a stop() function.
 */
export function startAutoScroll({ speed = 45, delay = 0, target = window } = {}) {
  let stopped = false
  let raf = 0
  let timer = 0
  let last = 0
  let lastKnownY = 0

  const doc = document.scrollingElement || document.documentElement
  const scroller = target === window ? doc : target
  const currentY = () => (target === window ? window.scrollY : target.scrollTop)
  const maxY = () => scroller.scrollHeight - (target === window ? window.innerHeight : target.clientHeight)

  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    clearTimeout(timer)
    events.forEach((ev) => window.removeEventListener(ev, onUser, true))
    if (target !== window) events.forEach((ev) => target.removeEventListener(ev, onUser, true))
  }

  // Any deliberate input from the guest ends the auto-scroll.
  const onUser = (e) => {
    if (e.type === 'scroll') {
      // A scroll we didn't cause (drag on scrollbar, momentum) -> user took over.
      if (Math.abs(currentY() - lastKnownY) > 4) stop()
      return
    }
    stop()
  }
  const events = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'mousedown', 'scroll']

  // Float accumulator: mobile browsers floor sub-pixel scrollTo, so at slow
  // speeds (<1px/frame) re-reading the rounded scroll position each frame never
  // advances. Track the target position as a float and round only when applying.
  let pos = 0

  const step = (t) => {
    if (stopped) return
    if (!last) last = t
    const dt = Math.min(0.1, (t - last) / 1000) // clamp for tab switches
    last = t
    // If the real position drifted from what we last set (user scroll, address
    // bar resize), resync so takeover detection stays honest.
    if (Math.abs(currentY() - lastKnownY) > 2) pos = currentY()
    pos = Math.min(maxY(), pos + speed * dt)
    const next = Math.round(pos)
    lastKnownY = next
    if (target === window) window.scrollTo(0, next)
    else target.scrollTop = next
    if (pos >= maxY() - 1) return stop()
    raf = requestAnimationFrame(step)
  }

  timer = setTimeout(() => {
    if (stopped) return
    pos = currentY()
    lastKnownY = currentY()
    events.forEach((ev) => window.addEventListener(ev, onUser, { capture: true, passive: true }))
    if (target !== window) events.forEach((ev) => target.addEventListener(ev, onUser, { capture: true, passive: true }))
    raf = requestAnimationFrame(step)
  }, Math.max(0, delay * 1000))

  return stop
}
