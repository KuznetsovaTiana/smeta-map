import type { Block } from '../../types/lifecycle.ts'

/** Будущие направления процесса 05 добавляются записями, без фиктивного содержания сейчас. */
export const blocks: Block[] = [
  {
    "id": "ncs",
    "processId": "pre-design",
    "order": 1,
    "title": "Расчёт смет по укрупнённым показателям (НЦС)"
  },
  {
    "id": "analog-objects",
    "processId": "pre-design",
    "order": 2,
    "title": "Расчёт с применением объектов-аналогов"
  },
  {
    "id": "engineering-surveys",
    "processId": "surveys-and-design",
    "order": 1,
    "title": "Расчёт смет на проведение инженерных изысканий"
  },
  {
    "id": "design-works",
    "processId": "surveys-and-design",
    "order": 2,
    "title": "Расчёт смет на проектные работы"
  },
  {
    "id": "design-p",
    "processId": "design",
    "order": 1,
    "title": "Стадия «П» — разработка проектной документации"
  },
  {
    "id": "design-r",
    "processId": "design",
    "order": 2,
    "title": "Стадия «Р» — разработка рабочей документации"
  },
  {
    "id": "as-built-estimate",
    "processId": "design",
    "order": 3,
    "title": "Исполнительная смета"
  },
  {
    "id": "estimate-expertise",
    "processId": "design",
    "order": 4,
    "title": "Проверка достоверности определения сметной стоимости строительства, реконструкции и капитального ремонта ОКС (экспертиза)"
  },
  {
    "id": "nmck",
    "processId": "construction",
    "order": 1,
    "title": "Определение начальной максимальной цены контракта (НМЦК)"
  },
  {
    "id": "contract-estimate",
    "processId": "construction",
    "order": 2,
    "title": "Смета контракта"
  },
  {
    "id": "work-accounting",
    "processId": "construction",
    "order": 3,
    "title": "Учёт выполненных работ"
  },
  {
    "id": "capital-repair",
    "processId": "operation-and-repair",
    "order": 1,
    "title": "Комплект проектно-сметной документации для капитального ремонта"
  },
  {
    "id": "current-repair",
    "processId": "operation-and-repair",
    "order": 2,
    "title": "Комплект сметной документации для текущего ремонта"
  },
  {
    "id": "technical-maintenance",
    "processId": "operation-and-repair",
    "order": 3,
    "title": "Сметы на техническую эксплуатацию и техническое обслуживание"
  }
]

