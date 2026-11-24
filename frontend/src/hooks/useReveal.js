import { useEffect } from 'react'

// Adds .visible to .reveal elements when they enter the viewport.
// Call once in PublicLayout (or per page) after mount.
export function useReveal(dep = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.visible)')
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((el) => el.classList.add('visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dep)
}
