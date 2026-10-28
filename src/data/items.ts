import type { ProcessItem } from '../types/process'
import { influenceItems } from './influenceItems'
import { relatedItems } from './relatedItems'

export const items: ProcessItem[] = [
  ...influenceItems,
  ...relatedItems,
  { id: 'ncs', title: 'НЦС', abbreviation: 'НЦС', type: 'regulation', stageId: 'preliminary-estimate', shortDescription: 'Укрупнённые нормативы цены строительства для предварительной оценки.' },
  { id: 'analog-objects', title: 'Объекты-аналоги', type: 'method', stageId: 'preliminary-estimate', shortDescription: 'Сопоставимые объекты для оценки предполагаемой стоимости.' },
  { id: 'aggregated-indicators', title: 'Укрупнённые показатели', type: 'method', stageId: 'preliminary-estimate', shortDescription: 'Показатели стоимости на укрупнённую единицу объекта.' },
  { id: 'preliminary-budget', title: 'Предварительный бюджет', type: 'result', stageId: 'preliminary-estimate', shortDescription: 'Ориентировочный бюджет проекта по результатам предварительной оценки.' },

  { id: 'pd-rd', title: 'ПД / РД', abbreviation: 'ПД / РД', type: 'document', stageId: 'source-data', shortDescription: 'Проектная и рабочая документация — источник данных для сметы.' },
  { id: 'drawings', title: 'Чертежи', type: 'document', stageId: 'source-data', shortDescription: 'Графические материалы с размерами и параметрами конструкций.' },
  { id: 'specifications', title: 'Спецификации', type: 'document', stageId: 'source-data', shortDescription: 'Сведения о материалах, изделиях и оборудовании проекта.' },
  { id: 'technical-solutions', title: 'Технические решения', type: 'document', stageId: 'source-data', shortDescription: 'Принятые проектом решения, определяющие состав и условия работ.' },

  { id: 'design-analysis', title: 'Анализ проектных решений', type: 'method', stageId: 'quantity-takeoff', shortDescription: 'Изучение документации для определения состава работ.' },
  { id: 'quantity-calculation', title: 'Расчёт объёмов', type: 'calculation', stageId: 'quantity-takeoff', shortDescription: 'Расчёт количества работ по проектным данным.' },
  { id: 'unit-check', title: 'Проверка единиц измерения', type: 'method', stageId: 'quantity-takeoff', shortDescription: 'Проверка соответствия единиц объёмов и сметных норм.' },
  { id: 'vor', title: 'ВОР', abbreviation: 'ВОР', type: 'document', stageId: 'quantity-takeoff', shortDescription: 'Ведомость объёмов работ с перечнем и количеством работ.' },

  { id: 'norm-selection', title: 'Подбор сметных норм', type: 'method', stageId: 'estimate-development', shortDescription: 'Выбор норм, соответствующих составу и технологии работ.' },
  { id: 'resource-cost', title: 'Стоимость ресурсов', type: 'condition', stageId: 'estimate-development', layerId: 'pricing', shortDescription: 'Определение стоимости ресурсов для сметного расчёта.', keywords: ['цены ресурсов'], conditionDetails: { costImpact: 'Цены ресурсов формируют ресурсную составляющую стоимости.', accounting: 'Проверяются характеристики, период и состав цены.', requiredInputs: ['Характеристики ресурсов', 'Источники цен', 'Условия поставки'] }, commonErrors: ['Повторный учёт доставки'] },
  { id: 'coefficients', title: 'Коэффициенты', type: 'condition', stageId: 'estimate-development', shortDescription: 'Поправки, учитывающие условия выполнения работ и применения норм.' },
  { id: 'production-conditions', title: 'Условия производства работ', type: 'condition', stageId: 'estimate-development', shortDescription: 'Условия выполнения работ, которые учитываются при выборе норм и применении коэффициентов.' },
  { id: 'lsr', title: 'ЛСР (ЛС)', abbreviation: 'ЛСР', type: 'document', stageId: 'estimate-development', shortDescription: 'Локальный сметный расчёт или локальная смета на отдельные виды работ и затрат.' },
  { id: 'osr', title: 'ОСР (ОС)', abbreviation: 'ОСР', type: 'document', stageId: 'estimate-development', shortDescription: 'Объектный сметный расчёт или объектная смета, объединяющие локальные расчёты при необходимости.' },
  { id: 'ssrss', title: 'ССРСС', abbreviation: 'ССРСС', type: 'document', stageId: 'estimate-development', shortDescription: 'Сводный сметный расчёт стоимости строительства.' },

  { id: 'internal-review', title: 'Внутренняя проверка', type: 'method', stageId: 'cost-approval', shortDescription: 'Проверка объёмов, норм, цен и расчётов до согласования.' },
  { id: 'expert-review', title: 'Экспертиза', type: 'method', stageId: 'cost-approval', shortDescription: 'Рассмотрение сметной документации экспертизой при необходимости.' },
  { id: 'review-comments', title: 'Замечания', type: 'result', stageId: 'cost-approval', shortDescription: 'Перечень вопросов и несоответствий, выявленных при проверке.' },
  { id: 'estimate-correction', title: 'Корректировка', type: 'method', stageId: 'cost-approval', shortDescription: 'Уточнение сметной документации по результатам проверки.' },

  { id: 'tender', title: 'Тендер', type: 'method', stageId: 'tender-contract', shortDescription: 'Процедура выбора исполнителя и согласования предложения.' },
  { id: 'commercial-offer', title: 'Коммерческое предложение', type: 'document', stageId: 'tender-contract', shortDescription: 'Предложение исполнителя по составу, стоимости и условиям работ.' },
  { id: 'contract-estimate', title: 'Смета к договору', type: 'document', stageId: 'tender-contract', shortDescription: 'Сметный документ с согласованной стоимостью работ по договору.' },
  { id: 'contract-price', title: 'Договорная цена', type: 'result', stageId: 'tender-contract', shortDescription: 'Стоимость, согласованная сторонами договора.' },

  { id: 'rd-changes', title: 'Изменение РД', type: 'document', stageId: 'construction-support', shortDescription: 'Изменения рабочей документации, влияющие на состав и стоимость работ.' },
  { id: 'quantity-changes', title: 'Изменение объёмов', type: 'calculation', stageId: 'construction-support', shortDescription: 'Определение отклонений объёмов от ранее согласованных.' },
  { id: 'additional-work', title: 'Дополнительные работы', type: 'condition', stageId: 'construction-support', shortDescription: 'Работы, добавляемые к первоначально согласованному составу.' },
  { id: 'excluded-work', title: 'Исключаемые работы', type: 'condition', stageId: 'construction-support', shortDescription: 'Работы, исключаемые из ранее согласованного состава.' },
  { id: 'cost-adjustment', title: 'Корректировка стоимости', type: 'calculation', stageId: 'construction-support', shortDescription: 'Перерасчёт стоимости с учётом изменений документации и работ.' },

  { id: 'actual-work', title: 'Фактически выполненные работы', type: 'result', stageId: 'work-accounting', shortDescription: 'Сведения о работах, выполненных за отчётный период.' },
  { id: 'quantity-confirmation', title: 'Подтверждение объёмов', type: 'method', stageId: 'work-accounting', shortDescription: 'Проверка факта и количества выполненных работ.' },
  { id: 'cumulative-accounting', title: 'Накопительный учёт', type: 'calculation', stageId: 'work-accounting', shortDescription: 'Учёт выполненных объёмов по периодам и с начала строительства.' },
  { id: 'ks-6a', title: 'КС-6а', abbreviation: 'КС-6а', type: 'document', stageId: 'work-accounting', shortDescription: 'Журнал учёта выполненных работ, используемый при применении этой формы.' },

  { id: 'confirmed-quantities', title: 'Подтверждённые объёмы', type: 'result', stageId: 'acceptance', shortDescription: 'Проверенные объёмы, используемые для оформления актов.' },
  { id: 'work-acceptance-act', title: 'Акт выполненных работ', type: 'document', stageId: 'acceptance', shortDescription: 'Документ, оформляющий приёмку выполненных работ.' },
  { id: 'ks-2', keywords: ['акт выполненных работ', 'актирование'], title: 'КС-2', abbreviation: 'КС-2', type: 'document', stageId: 'acceptance', shortDescription: 'Акт о приёмке выполненных работ при применении формы КС-2.' },

  { id: 'ks-3', title: 'КС-3', abbreviation: 'КС-3', type: 'document', stageId: 'project-closeout', shortDescription: 'Справка о стоимости выполненных работ и затрат при применении формы КС-3.' },
  { id: 'payment', title: 'Оплата', type: 'result', stageId: 'project-closeout', shortDescription: 'Сведения о проведённых расчётах за принятые работы.' },
  { id: 'contract-balance', title: 'Остаток по договору', type: 'calculation', stageId: 'project-closeout', shortDescription: 'Контроль оставшихся обязательств с учётом выполнения, приёмки и оплаты.' },
  { id: 'final-cost-analysis', title: 'Итоговый анализ стоимости', type: 'calculation', stageId: 'project-closeout', shortDescription: 'Сопоставление договорной и фактической стоимости, экономии и перерасхода.' },
]

