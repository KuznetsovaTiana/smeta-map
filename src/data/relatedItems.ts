import type { ProcessConnection, ProcessItem } from '../types/process'

export const relatedBlock = {
  title: 'Смежные документы и специальные ветви',
  description: 'Используются в работе сметчика при необходимости, но не являются самостоятельными этапами процесса',
}

export const relatedItems: ProcessItem[] = [
  {
    id: 'equipment', title: 'Оборудование', type: 'related', layerId: 'related',
    shortDescription: 'Отдельная ветвь определения затрат на оборудование, его доставку и монтаж.',
    relatedDetails: {
      purpose: 'Разделить стоимость приобретения оборудования и затраты на его доставку и монтаж.',
      stageIds: ['estimate-development'], relationships: ['Спецификации оборудования', 'Сметная документация'],
      dataMeaning: 'Формирует состав оборудования и затраты, связанные с его приобретением и установкой.',
      steps: ['Спецификация оборудования', 'Стоимость оборудования', 'Доставка', 'Монтаж'],
    },
    commonErrors: ['Повторный учёт доставки', 'Включение монтажа одновременно в цену оборудования и в стоимость работ'],
  },
  {
    id: 'commissioning', title: 'Пусконаладочные работы (ПНР)', abbreviation: 'ПНР', type: 'related', layerId: 'related',
    shortDescription: 'Работы по наладке и проверке готовности оборудования и систем к эксплуатации.',
    relatedDetails: {
      purpose: 'Определить состав и стоимость пусконаладочных работ отдельно от приобретения и монтажа.',
      stageIds: ['estimate-development'], relationships: ['Оборудование', 'Технические решения', 'Программа ПНР'],
      dataMeaning: 'Формирует обоснование состава и стоимости наладки.',
      steps: ['Исходные данные', 'Программа ПНР', 'Определение стоимости ПНР'],
    },
    commonErrors: ['Отсутствие программы и состава ПНР', 'Дублирование операций, учтённых в монтаже'],
  },
  {
    id: 'other-costs', title: 'Прочие затраты', type: 'related', layerId: 'related',
    shortDescription: 'Отдельная группа предусмотренных затрат, учитываемых при определении стоимости строительства.',
    relatedDetails: {
      purpose: 'Учесть обоснованные затраты, которые не включены в стоимость основных работ.',
      stageIds: ['estimate-development'], relationships: ['ССРСС', 'Условия производства и организации работ'],
      dataMeaning: 'Формирует соответствующие затраты в сводном расчёте при наличии оснований.',
      note: 'Могут включаться временные здания, зимнее удорожание, перевозка работников и другие предусмотренные затраты. Состав и основания проверяются для конкретного проекта.',
    },
    commonErrors: ['Двойной учёт затрат', 'Включение затрат без исходных данных и обоснования'],
  },
  {
    id: 'm29', title: 'М-29', abbreviation: 'М-29', type: 'related', layerId: 'related',
    shortDescription: 'Отчёт о расходе основных материалов',
    relatedDetails: {
      purpose: 'Сопоставить нормативный и фактический расход материалов с выполненными работами.',
      stageIds: ['work-accounting'], relationships: ['Фактически выполненные работы', 'Нормативный расход', 'Фактический расход'],
      dataMeaning: 'Подтверждает расход материалов и позволяет анализировать отклонения от нормативного расхода.',
      note: 'М-29 относится к производственному и материальному учёту и не является следующим этапом после КС-3.',
    },
    commonErrors: ['Подмена актирования материальным учётом', 'Несоответствие расхода фактическим объёмам работ'],
  },
  {
    id: 'm15', title: 'М-15', abbreviation: 'М-15', type: 'related', layerId: 'related',
    shortDescription: 'Накладная на отпуск материалов на сторону / документ материального учёта',
    relatedDetails: {
      purpose: 'Учитывать отпуск материалов и сверять сведения об их движении.',
      stageIds: [], relationships: ['Материальный учёт', 'Отпуск и движение материалов'],
      dataMeaning: 'Подтверждает передачу материалов; сама по себе не подтверждает объём выполненных работ.',
      note: 'Отдельный смежный документ материального учёта. Обязательная последовательность с М-29 или КС-3 отсутствует.',
    },
    commonErrors: ['Использование отпуска материалов как подтверждения выполненных работ'],
  },
  {
    id: 'execution-documents', title: 'Исполнительная документация', type: 'related', layerId: 'related',
    shortDescription: 'Подтверждение факта и объёма выполненных работ',
    keywords: ['АОСР', 'акт освидетельствования скрытых работ', 'исполнительные схемы', 'журналы работ', 'документы на материалы', 'протоколы испытаний', 'иные подтверждающие документы'],
    relatedDetails: {
      purpose: 'Сопоставить заявленные к учёту и приёмке объёмы с подтверждающими материалами.',
      stageIds: ['work-accounting', 'acceptance'], relationships: ['Подтверждение объёмов', 'Актирование выполненных работ'],
      dataMeaning: 'Подтверждает факт, объём и характеристики выполненных работ.',
      documents: ['АОСР', 'Исполнительные схемы', 'Журналы работ', 'Документы на материалы', 'Протоколы испытаний', 'Иные подтверждающие документы'],
    },
    commonErrors: ['Несоответствие документов заявленным объёмам', 'Отсутствие необходимых подтверждающих документов'],
  },
]

export const relatedConnections: ProcessConnection[] = [
  ...relatedItems.flatMap(item => (item.relatedDetails?.stageIds ?? []).map(target => ({
    id: `related-${item.id}-${target}`, source: item.id, target, type: 'related' as const,
  }))),
  { id: 'input-other-costs-ssrss', source: 'other-costs', target: 'ssrss', type: 'input' },
  { id: 'related-m29-actual-work', source: 'm29', target: 'actual-work', type: 'related' },
  { id: 'influence-temporary-other-costs', source: 'temporary-infrastructure', target: 'other-costs', type: 'influence' },
  { id: 'influence-winter-other-costs', source: 'winter-period', target: 'other-costs', type: 'influence' },
  { id: 'influence-transport-other-costs', source: 'worker-transport', target: 'other-costs', type: 'influence' },
]
