import type { Operation } from '../../types/lifecycle.ts'

/** П и Р имеют независимые операции. В сносе операции принадлежат непосредственно процессу. */
export const operations: Operation[] = [
  {
    "id": "design-p-source-data",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 1,
    "title": "Сбор и анализ исходных данных"
  },
  {
    "id": "design-p-vor",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 2,
    "title": "Ведомость объёмов работ (ВОР)"
  },
  {
    "id": "design-p-local-estimate-calculation",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 3,
    "title": "Локальный сметный расчёт"
  },
  {
    "id": "design-p-market-analysis",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 4,
    "title": "Конъюнктурный анализ цен"
  },
  {
    "id": "design-p-object-estimate-calculation",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 5,
    "title": "Объектный сметный расчёт"
  },
  {
    "id": "design-p-consolidated-estimate",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 6,
    "title": "Сводный сметный расчёт"
  },
  {
    "id": "design-p-cost-summary",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 7,
    "title": "Сводка затрат"
  },
  {
    "id": "design-p-explanatory-note",
    "parent": {
      "kind": "block",
      "id": "design-p"
    },
    "order": 8,
    "title": "Пояснительная записка"
  },
  {
    "id": "design-r-source-data",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 1,
    "title": "Сбор и анализ исходных данных"
  },
  {
    "id": "design-r-vor",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 2,
    "title": "Ведомость объёмов работ (ВОР)"
  },
  {
    "id": "design-r-local-estimate",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 3,
    "title": "Локальная смета"
  },
  {
    "id": "design-r-market-analysis",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 4,
    "title": "Конъюнктурный анализ цен"
  },
  {
    "id": "design-r-object-estimate",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 5,
    "title": "Объектная смета"
  },
  {
    "id": "design-r-consolidated-estimate",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 6,
    "title": "Сводный сметный расчёт"
  },
  {
    "id": "design-r-cost-summary",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 7,
    "title": "Сводка затрат"
  },
  {
    "id": "design-r-explanatory-note",
    "parent": {
      "kind": "block",
      "id": "design-r"
    },
    "order": 8,
    "title": "Пояснительная записка"
  },
  {
    "id": "contract-estimate-structural-elements",
    "parent": {
      "kind": "block",
      "id": "contract-estimate"
    },
    "order": 1,
    "title": "Ведомость конструктивных элементов"
  },
  {
    "id": "contract-estimate-draft",
    "parent": {
      "kind": "block",
      "id": "contract-estimate"
    },
    "order": 2,
    "title": "Проект сметы контракта"
  },
  {
    "id": "contract-estimate-final",
    "parent": {
      "kind": "block",
      "id": "contract-estimate"
    },
    "order": 3,
    "title": "Смета контракта"
  },
  {
    "id": "capital-repair-source-data",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 1,
    "title": "Сбор и анализ исходных данных"
  },
  {
    "id": "capital-repair-survey-estimate",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 2,
    "title": "Расчёт смет на работы по обследованию"
  },
  {
    "id": "capital-repair-defect-list",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 3,
    "title": "Дефектная ведомость"
  },
  {
    "id": "capital-repair-local-estimate",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 4,
    "title": "Локальная смета"
  },
  {
    "id": "capital-repair-market-analysis",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 5,
    "title": "Конъюнктурный анализ цен"
  },
  {
    "id": "capital-repair-object-estimate",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 6,
    "title": "Объектная смета"
  },
  {
    "id": "capital-repair-consolidated-estimate",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 7,
    "title": "Сводный сметный расчёт"
  },
  {
    "id": "capital-repair-explanatory-note",
    "parent": {
      "kind": "block",
      "id": "capital-repair"
    },
    "order": 8,
    "title": "Пояснительная записка"
  },
  {
    "id": "current-repair-source-data",
    "parent": {
      "kind": "block",
      "id": "current-repair"
    },
    "order": 1,
    "title": "Сбор и анализ исходных данных"
  },
  {
    "id": "current-repair-defect-list",
    "parent": {
      "kind": "block",
      "id": "current-repair"
    },
    "order": 2,
    "title": "Дефектная ведомость / акт"
  },
  {
    "id": "current-repair-local-estimate",
    "parent": {
      "kind": "block",
      "id": "current-repair"
    },
    "order": 3,
    "title": "Локальная смета"
  },
  {
    "id": "current-repair-market-analysis",
    "parent": {
      "kind": "block",
      "id": "current-repair"
    },
    "order": 4,
    "title": "Конъюнктурный анализ цен"
  },
  {
    "id": "current-repair-explanatory-note",
    "parent": {
      "kind": "block",
      "id": "current-repair"
    },
    "order": 5,
    "title": "Пояснительная записка"
  },
  {
    "id": "demolition-source-data",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 1,
    "title": "Сбор и анализ исходных данных"
  },
  {
    "id": "demolition-survey-estimate",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 2,
    "title": "Расчёт смет на работы по обследованию"
  },
  {
    "id": "demolition-defect-list",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 3,
    "title": "Дефектная ведомость"
  },
  {
    "id": "demolition-local-estimate",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 4,
    "title": "Локальная смета"
  },
  {
    "id": "demolition-market-analysis",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 5,
    "title": "Конъюнктурный анализ цен"
  },
  {
    "id": "demolition-object-estimate",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 6,
    "title": "Объектная смета"
  },
  {
    "id": "demolition-consolidated-estimate",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 7,
    "title": "Сводный сметный расчёт"
  },
  {
    "id": "demolition-explanatory-note",
    "parent": {
      "kind": "process",
      "id": "demolition"
    },
    "order": 8,
    "title": "Пояснительная записка"
  }
]

