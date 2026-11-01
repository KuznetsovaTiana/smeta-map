import type { Process } from '../../types/lifecycle.ts'

/** Единая структура для обоих регионов; названия и порядок из ТЗ. */
export const processes: Process[] = [
  {
    "id": "pre-design",
    "order": 1,
    "title": "Предпроектная стадия"
  },
  {
    "id": "surveys-and-design",
    "order": 2,
    "title": "Инженерные изыскания и проектные работы"
  },
  {
    "id": "design",
    "order": 3,
    "title": "Проектная стадия (архитектурно-строительное проектирование)"
  },
  {
    "id": "construction",
    "order": 4,
    "title": "Стадия строительства"
  },
  {
    "id": "operation-and-repair",
    "order": 5,
    "title": "Эксплуатация, ремонт и реконструкция"
  },
  {
    "id": "demolition",
    "order": 6,
    "title": "Снос"
  }
]

