import type { ViewMode } from '../../types/process'

export function ViewModeSwitch({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return <div className="view-mode-switch" role="group" aria-label="Режим отображения схемы">
    <button type="button" aria-pressed={mode === 'overview'} onClick={() => onChange('overview')}>Обзор</button>
    <button type="button" aria-pressed={mode === 'detailed'} onClick={() => onChange('detailed')}>Подробно</button>
  </div>
}
