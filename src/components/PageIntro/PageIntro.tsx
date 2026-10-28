interface PageIntroProps {
  number: string
  title: string
  description: string
}

export function PageIntro({ number, title, description }: PageIntroProps) {
  return <div className="page-intro">
    <p className="eyebrow">Сметное дело <span>/ {number}</span></p>
    <h1>{title}</h1><p className="page-description">{description}</p>
  </div>
}
