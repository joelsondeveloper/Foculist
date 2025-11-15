export type RuleField =
  | "title"
  | "description"
  | "status"
  | "priority"
  | "dueDate"
  | "isCompleted";

export type RuleOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "lessThan"
  | "greaterThan"
  | "between"
  | "isTrue"
  | "isFalse"
  | "isNull"
  | "isNotNull"
  | "isPast"
  | "isFuture"
  | "isToday"
  | "isTomorrow";

export interface Rule {
  field: RuleField;
  operator: RuleOperator;
  value?: any;
  value2?: any;
}

export interface AutomationRule {
  rules: Rule[];
  logicalOperator?: "AND" | "OR";
}

export const fieldOptions: {
  value: RuleField;
  label: string;
  type: "string" | "date" | "boolean" | "category" | "priority";
}[] = [
  { value: "title", label: "Titulo da Tarefa", type: "string" },
  { value: "description", label: "Descrição da Tarefa", type: "string" },
  { value: "status", label: "Status", type: "string" },
  { value: "priority", label: "Prioridade", type: "string" },
  { value: "dueDate", label: "Data de Vencimento", type: "date" },
  { value: "isCompleted", label: "Status de Conclusão", type: "boolean" },
];

export const operatorOptions: {
  value: RuleOperator;
  label: string;
  supportedTypes: Array<"string" | "date" | "priority" | "boolean" | "category">;
}[] = [
  {
    value: "equals",
    label: "é igual a",
    supportedTypes: ["string", "date", "priority", "boolean", "category"],
  },
  {
    value: "notEquals",
    label: "não é igual a",
    supportedTypes: ["string", "date", "priority", "boolean", "category"],
  },
  { value: "contains", label: "contém", supportedTypes: ["string"] },
  { value: "notContains", label: "não contém", supportedTypes: ["string"] },
  { value: "lessThan", label: "é menor que", supportedTypes: ["date"] },
  { value: "greaterThan", label: "é maior que", supportedTypes: ["date"] },
  { value: "between", label: "está entre", supportedTypes: ["date"] },
  { value: "isTrue", label: "é verdadeiro", supportedTypes: ["boolean"] },
  { value: "isFalse", label: "é falso", supportedTypes: ["boolean"] },
  {
    value: "isNull",
    label: "está vazio",
    supportedTypes: ["string", "date", "priority", "boolean", "category"],
  },
  {
    value: "isNotNull",
    label: "não está vazio",
    supportedTypes: ["string", "date", "priority", "boolean", "category"],
  },
  { value: "isPast", label: "está no passado", supportedTypes: ["date"] },
  { value: "isFuture", label: "está no futuro", supportedTypes: ["date"] },
  { value: "isToday", label: "é hoje", supportedTypes: ["date"] },
  { value: "isTomorrow", label: "é amanhã", supportedTypes: ["date"] },
];

export const priorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];