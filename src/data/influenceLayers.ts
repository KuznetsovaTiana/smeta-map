export const influenceLayers = [
  {
    id: 'conditions' as const,
    title: 'Условия производства и организации работ',
    description: 'Влияют на определение и корректировку стоимости',
    stageIds: ['preliminary-estimate', 'estimate-development', 'tender-contract', 'construction-support'],
  },
  {
    id: 'pricing' as const,
    title: 'Ценообразование и уровень цен',
    description: 'Определяют стоимостную базу расчёта',
    stageIds: ['preliminary-estimate', 'estimate-development', 'cost-approval', 'tender-contract', 'construction-support'],
  },
]
