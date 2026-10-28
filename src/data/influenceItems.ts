import type { ProcessItem } from '../types/process'

export const influenceItems: ProcessItem[] = [
  {
    "id": "confined-conditions",
    "title": "Стеснённые условия",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Ограниченное пространство для выполнения работ.",
    "conditionDetails": {
      "costImpact": "Ограничения снижают производительность и меняют технологию.",
      "accounting": "Учитываются при выборе технологии и применимых коэффициентов.",
      "requiredInputs": [
        "План площадки",
        "Зоны ограничений"
      ]
    },
    "commonErrors": [
      "Коэффициенты без подтверждения стеснённости"
    ],
    "keywords": []
  },
  {
    "id": "operating-enterprise",
    "title": "Действующее предприятие",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Работы на объекте, продолжающем эксплуатацию.",
    "conditionDetails": {
      "costImpact": "Режим предприятия ограничивает время и способы работ.",
      "accounting": "Учитываются ограничения доступа и организации работ.",
      "requiredInputs": [
        "Режим эксплуатации",
        "Требования заказчика"
      ]
    },
    "commonErrors": [
      "Игнорирование действующего производства"
    ],
    "keywords": []
  },
  {
    "id": "height-underground",
    "title": "Высотные / подземные условия",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Работы на высоте или ниже поверхности земли.",
    "conditionDetails": {
      "costImpact": "Доступ требует особой организации.",
      "accounting": "Учитываются проектные решения и условия применения норм.",
      "requiredInputs": [
        "Отметки работ",
        "Технология доступа"
      ]
    },
    "commonErrors": [
      "Игнорирование условий доступа"
    ],
    "keywords": []
  },
  {
    "id": "winter-period",
    "title": "Зимний период",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Выполнение работ при зимних климатических условиях.",
    "conditionDetails": {
      "costImpact": "Могут потребоваться прогрев, защита и дополнительные операции.",
      "accounting": "Затраты обосновываются периодом и условиями строительства.",
      "requiredInputs": [
        "Календарный график",
        "Климатические данные"
      ]
    },
    "commonErrors": [
      "Зимние затраты без привязки к периоду"
    ],
    "keywords": [
      "зима",
      "зимние работы"
    ]
  },
  {
    "id": "shift-method",
    "title": "Вахтовый метод",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Организация труда с периодическим выездом работников к удалённому объекту.",
    "conditionDetails": {
      "costImpact": "Возникают затраты на доставку, проживание и организацию вахты.",
      "accounting": "Состав затрат определяется принятой организацией строительства.",
      "requiredInputs": [
        "График вахт",
        "Численность работников",
        "Условия проживания"
      ]
    },
    "commonErrors": [
      "Двойной учёт проживания и доставки"
    ],
    "keywords": [
      "вахта",
      "вахтовый"
    ]
  },
  {
    "id": "business-trips",
    "title": "Командировки",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Направление работников вне постоянного места работы.",
    "conditionDetails": {
      "costImpact": "Расходы зависят от длительности и места поездки.",
      "accounting": "Обосновываются состав, сроки и расходы.",
      "requiredInputs": [
        "Сроки поездок",
        "Численность работников"
      ]
    },
    "commonErrors": [
      "Смешение командировок и вахтового метода"
    ],
    "keywords": []
  },
  {
    "id": "worker-transport",
    "title": "Перевозка работников",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Доставка работников к месту работ.",
    "conditionDetails": {
      "costImpact": "Затраты зависят от маршрутов и числа рейсов.",
      "accounting": "Определяются по транспортной схеме.",
      "requiredInputs": [
        "Маршруты",
        "График перевозок"
      ]
    },
    "commonErrors": [
      "Дублирование транспортных расходов"
    ],
    "keywords": []
  },
  {
    "id": "resource-logistics",
    "title": "Логистика материалов и техники",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Доставка и перемещение ресурсов.",
    "conditionDetails": {
      "costImpact": "Плечо доставки и перегрузки влияют на затраты.",
      "accounting": "Учитываются маршруты и условия поставки.",
      "requiredInputs": [
        "Схема доставки",
        "Условия поставки"
      ]
    },
    "commonErrors": [
      "Повторный учёт доставки"
    ],
    "keywords": []
  },
  {
    "id": "remote-location",
    "title": "Удалённость объекта",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Удалённое расположение площадки.",
    "conditionDetails": {
      "costImpact": "Доступность влияет на снабжение и организацию работ.",
      "accounting": "Обосновываются затраты, связанные с расположением.",
      "requiredInputs": [
        "Местоположение",
        "Транспортная доступность"
      ]
    },
    "commonErrors": [
      "Необоснованная надбавка за удалённость"
    ],
    "keywords": []
  },
  {
    "id": "equipment-relocation",
    "title": "Передислокация техники",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Перемещение машин между базой и объектом.",
    "conditionDetails": {
      "costImpact": "Требует перевозки, подготовки и сборки техники.",
      "accounting": "Учитываются состав машин и схема перемещения.",
      "requiredInputs": [
        "Перечень машин",
        "Расстояния перевозки"
      ]
    },
    "commonErrors": [
      "Повторный учёт передислокации"
    ],
    "keywords": []
  },
  {
    "id": "temporary-infrastructure",
    "title": "Временная инфраструктура",
    "type": "condition",
    "layerId": "conditions",
    "shortDescription": "Временные объекты и сети для строительства.",
    "conditionDetails": {
      "costImpact": "Создание и содержание инфраструктуры требует затрат.",
      "accounting": "Учитывается состав временных объектов.",
      "requiredInputs": [
        "План площадки",
        "Потребность во временных сетях"
      ]
    },
    "commonErrors": [
      "Смешение постоянных и временных объектов"
    ],
    "keywords": []
  },
  {
    "id": "construction-territory",
    "title": "Территория строительства",
    "type": "condition",
    "layerId": "pricing",
    "shortDescription": "Место строительства и территориальные условия расчёта.",
    "conditionDetails": {
      "costImpact": "Цены и материалы зависят от территории.",
      "accounting": "Выбираются данные для территории объекта.",
      "requiredInputs": [
        "Адрес объекта",
        "Территория расчёта"
      ]
    },
    "commonErrors": [
      "Данные другой территории"
    ],
    "keywords": []
  },
  {
    "id": "cost-date",
    "title": "Дата определения стоимости",
    "type": "condition",
    "layerId": "pricing",
    "shortDescription": "Период, к которому приводится стоимость.",
    "conditionDetails": {
      "costImpact": "Цены и индексы относятся к определённому периоду.",
      "accounting": "Данные согласуются по периоду расчёта.",
      "requiredInputs": [
        "Дата расчёта",
        "Период цен"
      ]
    },
    "commonErrors": [
      "Смешение цен разных периодов"
    ],
    "keywords": []
  },
  {
    "id": "calculation-method",
    "title": "Метод расчёта",
    "type": "condition",
    "layerId": "pricing",
    "shortDescription": "Способ определения сметной стоимости.",
    "conditionDetails": {
      "costImpact": "Метод определяет применение норм, цен и индексов.",
      "accounting": "Согласуется метод и состав данных.",
      "requiredInputs": [
        "Задание на расчёт",
        "Условия проекта"
      ]
    },
    "commonErrors": [
      "Смешение несовместимых методов"
    ],
    "keywords": []
  },
  {
    "id": "estimate-base",
    "title": "Сметно-нормативная база",
    "type": "condition",
    "layerId": "pricing",
    "shortDescription": "Совокупность норм и данных для расчёта.",
    "conditionDetails": {
      "costImpact": "Состав и редакция базы влияют на результат.",
      "accounting": "Фиксируется база и её редакция.",
      "requiredInputs": [
        "Наименование базы",
        "Редакция базы"
      ]
    },
    "commonErrors": [
      "Разные редакции без проверки"
    ],
    "keywords": []
  },
  {
    "id": "price-indices",
    "title": "Индексы",
    "type": "condition",
    "layerId": "pricing",
    "shortDescription": "Показатели изменения стоимости.",
    "conditionDetails": {
      "costImpact": "Приводят стоимость к требуемому уровню цен при применимом методе.",
      "accounting": "Подбираются по периоду, территории и виду расчёта.",
      "requiredInputs": [
        "Период",
        "Территория",
        "Вид индекса"
      ]
    },
    "commonErrors": [
      "Индекс к неподходящей базе"
    ],
    "keywords": []
  },
  {
    "id": "fgis-cs",
    "title": "ФГИС ЦС",
    "type": "condition",
    "layerId": "pricing",
    "shortDescription": "Федеральная государственная информационная система ценообразования в строительстве.",
    "conditionDetails": {
      "costImpact": "Предоставляет стоимостные данные.",
      "accounting": "Проверяются территория, период и соответствие ресурса.",
      "requiredInputs": [
        "Характеристики ресурса",
        "Период расчёта"
      ]
    },
    "commonErrors": [
      "Выбор только по похожему названию"
    ],
    "keywords": [
      "ФГИС"
    ]
  },
  {
    "id": "market-analysis",
    "title": "Конъюнктурный анализ",
    "type": "condition",
    "layerId": "pricing",
    "shortDescription": "Сопоставление предложений на сопоставимые ресурсы.",
    "conditionDetails": {
      "costImpact": "Обосновывает цену с учётом характеристик и поставки.",
      "accounting": "Сравниваются предложения с одинаковым составом цены.",
      "requiredInputs": [
        "Ценовые предложения",
        "Характеристики",
        "Условия поставки"
      ]
    },
    "commonErrors": [
      "Сравнение цен с разным составом доставки"
    ],
    "keywords": [
      "конъюнктурный"
    ]
  }
]
