import type { Regulation, RegulationType } from '../types/regulation'

export const regulationTypes: { id: RegulationType; title: string }[] = [
  { id: 'law', title: 'Федеральный закон' },
  { id: 'government-decree', title: 'Постановление Правительства' },
  { id: 'ministry-order', title: 'Приказ Минстроя' },
  { id: 'methodology', title: 'Методика' },
  { id: 'standard', title: 'Стандарт' },
  { id: 'estimate-standard', title: 'Сметный норматив' },
  { id: 'regional', title: 'Региональный материал' },
  { id: 'reference', title: 'Справочный материал' },
]

export const regulationCategories = [
  { id: 'legislation', title: 'Федеральное законодательство' },
  { id: 'decrees', title: 'Постановления Правительства' },
  { id: 'orders', title: 'Приказы Минстроя' },
  { id: 'methodologies', title: 'Методики определения стоимости' },
  { id: 'estimate-standards', title: 'Сметные нормативы' },
  { id: 'fsnb-gesn', title: 'ФСНБ / ГЭСН' },
  { id: 'prices', title: 'Индексы и цены ресурсов' },
  { id: 'fgis', title: 'ФГИС ЦС' },
  { id: 'moscow', title: 'Московская нормативная база', regions: ['moscow'] },
  { id: 'regions', title: 'Региональные материалы', regions: ['regions'] },
  { id: 'references', title: 'Методические и справочные документы' },
]

/** Тестовые навигационные карточки. Неуказанные реквизиты и редакции требуют заполнения. */
export const regulations: Regulation[] = [
  { id: 'methodology-421', title: 'Методика определения сметной стоимости № 421/пр', shortTitle: 'Методика № 421/пр', documentNumber: '421/пр', type: 'methodology', categoryId: 'methodologies', description: 'Учебная карточка методики определения сметной стоимости. Ссылка и сведения о редакции пока не добавлены.', relatedStages: ['estimate-development', 'cost-approval'], relatedItems: ['lsr', 'osr', 'ssrss'], tags: ['421', '421/пр', 'сметная стоимость'] },
  { id: 'fsnb', title: 'Федеральная сметно-нормативная база', shortTitle: 'ФСНБ', type: 'estimate-standard', categoryId: 'fsnb-gesn', description: 'Карточка сметно-нормативной базы. Конкретная редакция и состав материалов пока не указаны.', relatedStages: ['estimate-development'], relatedItems: ['lsr', 'osr', 'ssrss', 'estimate-base'], tags: ['ФСНБ', 'нормы'] },
  { id: 'gesn', title: 'Государственные элементные сметные нормы', shortTitle: 'ГЭСН', type: 'estimate-standard', categoryId: 'fsnb-gesn', description: 'Карточка сметных норм. Сборники и редакции пока не указаны.', relatedStages: ['estimate-development', 'cost-approval'], relatedItems: ['norm-selection', 'lsr'], tags: ['ГЭСН', 'нормы'] },
  { id: 'fgis-source', title: 'ФГИС ЦС — справочный материал', shortTitle: 'ФГИС ЦС', type: 'reference', categoryId: 'fgis', description: 'Место для справочных материалов по ФГИС ЦС. Материалы пока не добавлены.', relatedStages: ['estimate-development'], relatedItems: ['fgis-cs', 'resource-cost', 'lsr'], tags: ['ФГИС', 'цены ресурсов'] },
  { id: 'ncs-reference', title: 'Нормативный материал по НЦС', shortTitle: 'НЦС', type: 'estimate-standard', categoryId: 'estimate-standards', description: 'Тестовая карточка материала по НЦС. Сборник, год и реквизиты пока не указаны.', relatedStages: ['preliminary-estimate'], relatedItems: ['ncs'], tags: ['НЦС', 'укрупнённые нормативы'] },
  { id: 'indices-reference', title: 'Нормативный материал по индексам', shortTitle: 'Индексы', type: 'reference', categoryId: 'prices', description: 'Тестовая карточка источника индексов. Период, территория и реквизиты пока не указаны.', relatedStages: ['estimate-development', 'cost-approval'], relatedItems: ['price-indices', 'lsr', 'osr', 'ssrss'], tags: ['индексы', 'цены'] },
  { id: 'moscow-tsn', title: 'Московский нормативный материал / ТСН', shortTitle: 'ТСН', type: 'regional', categoryId: 'moscow', regions: ['moscow'], description: 'Региональный пример для Москвы. Конкретный документ, редакция и реквизиты пока не указаны.', relatedStages: ['estimate-development'], relatedItems: ['estimate-base', 'lsr'], tags: ['ТСН', 'Москва'] },
  { id: 'regional-reference', title: 'Региональный справочный материал', type: 'regional', categoryId: 'regions', regions: ['regions'], description: 'Тестовая карточка регионального режима. Территория и конкретный документ пока не указаны.', relatedStages: ['estimate-development'], relatedItems: ['lsr', 'construction-territory'], tags: ['регионы'] },
]
