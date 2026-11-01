import type { MaterialType } from '../../types/document.ts'

/** Справочник типов не создаёт материалы автоматически. */
export const materialTypes: MaterialType[] = [
  {
    "id": "example",
    "title": "Образец"
  },
  {
    "id": "template",
    "title": "Шаблон"
  },
  {
    "id": "instruction",
    "title": "Инструкция"
  },
  {
    "id": "regulation",
    "title": "Нормативный документ"
  },
  {
    "id": "drive-folder",
    "title": "Папка Google Drive"
  },
  {
    "id": "reference",
    "title": "Справочный материал"
  }
]

