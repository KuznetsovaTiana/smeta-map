import { useSearchParams } from 'react-router-dom'
import { getRegion } from '../../utils/routing'
import estimateHeroRegions from '../../assets/estimate-hero-regions.svg'
import { useEffect, useRef } from 'react'
import estimateHero from '../../assets/estimate-hero.svg'

export function SchemaHero() {
  const [params] = useSearchParams()
  const heroRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const hero = heroRef.current
    const drawing = drawingRef.current
    if (!hero || !drawing) return
    const media = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    const reset = () => { cancelAnimationFrame(frame); drawing.style.transform = '' }
    const move = (event: PointerEvent) => {
      if (!media.matches) return
      const rect = hero.getBoundingClientRect()
      const x = Math.max(-3, Math.min(3, ((event.clientX - rect.left) / rect.width - .5) * 6))
      const y = Math.max(-3, Math.min(3, ((event.clientY - rect.top) / rect.height - .5) * 6))
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => { drawing.style.transform = `translate3d(${x}px, ${y}px, 0)` })
    }
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', reset)
    media.addEventListener('change', reset)
    return () => { reset(); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', reset); media.removeEventListener('change', reset) }
  }, [])
  return <div ref={heroRef} className="schema-hero">
    <div className="schema-hero-copy">
      <h1>Сметное дело</h1>
      <p className="schema-hero-tagline">От предварительной оценки стоимости до закрытия проекта</p>
    </div>
    <img ref={drawingRef} className="schema-hero-drawing" src={getRegion(params) === 'regions' ? estimateHeroRegions : estimateHero} width="440" height="240" alt="" aria-hidden="true" />
  </div>
}
