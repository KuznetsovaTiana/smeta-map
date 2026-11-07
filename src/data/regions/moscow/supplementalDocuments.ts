import type { DocumentPosition } from '../../../types/document.ts'

/** Подготовлено по публичному каталогу; ID и ссылки на конкретные файлы проверены 07.11.2026. */
export const supplementalDocuments: DocumentPosition[] = [
  {
    "id": "moscow-surveys-and-design-materials-document",
    "regionId": "moscow",
    "owner": {
      "kind": "process",
      "id": "surveys-and-design"
    },
    "order": 1,
    "title": "Учебные материалы по проектным и изыскательским работам"
  },
  {
    "id": "moscow-engineering-surveys-materials-document",
    "regionId": "moscow",
    "owner": {
      "kind": "block",
      "id": "engineering-surveys"
    },
    "order": 1,
    "title": "Практическое задание: расчёт стоимости изысканий"
  },
  {
    "id": "moscow-design-works-materials-document",
    "regionId": "moscow",
    "owner": {
      "kind": "block",
      "id": "design-works"
    },
    "order": 1,
    "title": "Практическое задание: расчёт стоимости проектных работ"
  }
]
