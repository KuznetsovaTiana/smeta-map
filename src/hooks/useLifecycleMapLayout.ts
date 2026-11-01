import { useSyncExternalStore } from 'react'

const mobileQuery = '(max-width: 767px)'
const tabletQuery = '(max-width: 1365px)'

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(mobileQuery), window.matchMedia(tabletQuery)]
  queries.forEach(query => query.addEventListener('change', onChange))
  return () => { queries.forEach(query => query.removeEventListener('change', onChange)) }
}

/** 0 сохраняет desktop-строку; телефон — две колонки, планшет — три. */
export function useLifecycleMapLayout(): 0 | 2 | 3 {
  return useSyncExternalStore(subscribe,
    () => window.matchMedia(mobileQuery).matches ? 2 : window.matchMedia(tabletQuery).matches ? 3 : 0,
    () => 0)
}
