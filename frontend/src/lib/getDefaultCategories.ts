import { CategoryCreateDTO } from "@/models/Category";

export function getDefaultCategories(userId: string): CategoryCreateDTO[] {
  return [
    {
      title: "Atrasado",
      color: "#EF4444",
      userId,
      automationRule: {
        rules: [{ field: "dueDate", operator: "isPast" }],
        logicalOperator: "AND",
      },
    },
    {
      title: "Hoje",
      color: "#3B82F6",
      userId,
      automationRule: {
        rules: [
          { field: "dueDate", operator: "isToday" },
          { field: "isCompleted", operator: "isFalse" },
        ],
        logicalOperator: "AND",
      },
    },
    {
      title: "Em andamento",
      color: "#F97316",
      userId,
      automationRule: null,
    },
    {
      title: "Concluído",
      color: "#22C55E",
      userId,
      automationRule: {
        rules: [{ field: "isCompleted", operator: "isTrue" }],
        logicalOperator: "AND",
      },
    },
  ];
}
