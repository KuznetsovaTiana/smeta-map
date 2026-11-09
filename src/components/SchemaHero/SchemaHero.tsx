import { useSearchParams } from 'react-router-dom'
import { getRegion } from '../../utils/routing'
import estimateHeroRegions from '../../assets/estimate-hero-regions.svg'
import { useEffect, useRef } from 'react'
import estimateHero from '../../assets/estimate-hero.svg'
import { BookOpen, ArrowUpRight } from 'lucide-react'
import { siteInstruction, siteMaterials } from '../../data/siteDocuments'

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
      <p className="schema-hero-tagline">Ценообразование и сметное дело на жизненном цикле объекта капитального строительства</p>
    </div>
    <div className="schema-hero-documents">
    <a className="schema-hero-instruction" href={siteInstruction.url} target="_blank" rel="noopener noreferrer" aria-label="Инструкция — открыть PDF в новой вкладке">
      <BookOpen size={22} strokeWidth={1.5} aria-hidden="true" />
      <span>{siteInstruction.title}<small>PDF</small></span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
    <a className="schema-hero-instruction" href={siteMaterials.url} target="_blank" rel="noopener noreferrer" aria-label="Инструкция кратко — открыть PDF в новой вкладке">
      <BookOpen size={22} strokeWidth={1.5} aria-hidden="true" />
      <span>{siteMaterials.title}<small>PDF</small></span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
    </div>
    <img ref={drawingRef} className="schema-hero-drawing" src={getRegion(params) === 'regions' ? estimateHeroRegions : estimateHero} width="440" height="240" alt="" aria-hidden="true" />
  </div>
}
