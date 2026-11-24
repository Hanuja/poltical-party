// Event cover images come from the Events API (`image`, an absolute URL to backend/uploads/events/…).
// The fallback is used only when an event has no cover image, or the file fails to load.
export const EVENT_IMAGE_FALLBACK = '/images/placeholder-event-1.svg'

export const eventImage = (ev) =>
  (ev && typeof ev.image === 'string' && ev.image.trim()) || EVENT_IMAGE_FALLBACK

// <img onError> handler — swaps to the fallback once (never loops).
export function onEventImageError(e) {
  const img = e.currentTarget
  if (img.dataset.fallback === '1') return
  img.dataset.fallback = '1'
  img.src = EVENT_IMAGE_FALLBACK
}
