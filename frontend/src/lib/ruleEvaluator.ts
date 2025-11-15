import { ITaskClient } from "@/models/Task";
import { ICategoryClient } from "@/models/Category";
import { isPast, isFuture, isToday, isTomorrow, parseISO } from "date-fns";

type AutomationRule = ICategoryClient["automationRule"];

export function evaluateRule(task: ITaskClient, rule: AutomationRule): boolean {
  if (!rule || !rule.rules || rule.rules.length === 0) return false;

  const results = rule.rules.map((r) => {
    let fieldValue: any;
    let ruleValue: any = r.value;
    let ruleValue2: any = r.value2;

    switch (r.field) {
      case "title":
        fieldValue = task.title;
        break;
      case "description":
        fieldValue = task.description;
        break;
      case "status":
        fieldValue = String(task.status);
        break;
      case "dueDate":
        fieldValue = task.dueDate ? new Date(task.dueDate) : null;
        if (
          typeof ruleValue === "string" &&
          ruleValue.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          ruleValue = parseISO(ruleValue);
        }
        if (
          typeof ruleValue2 === "string" &&
          ruleValue2.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          ruleValue2 = parseISO(ruleValue2);
        }
        break;
      case "priority":
        fieldValue = task.priority;
        break;
      case "isCompleted":
        fieldValue = task.isCompleted;
        break;
      default:
        return false;
    }

    let currentResult = false;

    switch (r.operator) {
      case "equals":
        if (
          r.field === "dueDate" &&
          fieldValue instanceof Date &&
          ruleValue instanceof Date
        ) {
          currentResult =
            fieldValue.toISOString().split("T")[0] ===
            ruleValue.toISOString().split("T")[0];
        } else if (
          r.field === "priority" ||
          r.field === "isCompleted" ||
          r.field === "status"
        ) {
          currentResult = String(fieldValue) === String(ruleValue);
        } else {
          currentResult = fieldValue === ruleValue;
        }
        break;
      case "notEquals":
        if (
          r.field === "dueDate" &&
          fieldValue instanceof Date &&
          ruleValue instanceof Date
        ) {
          currentResult =
            fieldValue.toISOString().split("T")[0] !==
            ruleValue.toISOString().split("T")[0];
        } else if (
          r.field === "priority" ||
          r.field === "isCompleted" ||
          r.field === "status"
        ) {
          currentResult = String(fieldValue) !== String(ruleValue);
        } else {
          currentResult = fieldValue !== ruleValue;
        }
        break;
      case "contains":
        currentResult =
          typeof fieldValue === "string" &&
          typeof ruleValue === "string" &&
          fieldValue.toLowerCase().includes(ruleValue.toLowerCase());
        break;
      case "notContains":
        currentResult =
          typeof fieldValue === "string" &&
          typeof ruleValue === "string" &&
          !fieldValue.toLowerCase().includes(ruleValue.toLowerCase());
        break;
      case "lessThan":
        currentResult =
          fieldValue !== null && ruleValue !== null && fieldValue < ruleValue;
        break;
      case "greaterThan":
        currentResult =
          fieldValue !== null && ruleValue !== null && fieldValue > ruleValue;
        break;
      case "between":
        currentResult =
          fieldValue !== null &&
          ruleValue !== null &&
          ruleValue2 !== null &&
          fieldValue >= ruleValue &&
          fieldValue <= ruleValue2;
        break;
      case "isTrue":
        currentResult = fieldValue === true;
        break;
      case "isFalse":
        currentResult = fieldValue === false;
        break;
      case "isNull":
        currentResult =
          fieldValue === null || fieldValue === undefined || fieldValue === "";
        break;
      case "isNotNull":
        currentResult =
          fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
        break;
      case "isPast":
        currentResult =
          fieldValue instanceof Date &&
          isPast(fieldValue) &&
          !isToday(fieldValue);
        break;
      case "isFuture":
        currentResult =
          fieldValue instanceof Date &&
          isFuture(fieldValue) &&
          !isToday(fieldValue);
        break;
      case "isToday":
        currentResult = fieldValue instanceof Date && isToday(fieldValue);
        break;
      case "isTomorrow":
        currentResult = fieldValue instanceof Date && isTomorrow(fieldValue);
        break;
      default:
        return false;
    }
    return currentResult;
  });

  console.log(
    `  Final Rule Evaluation: ${
      rule.logicalOperator
    } -> Results: [${results.join(", ")}] -> Final: ${
      rule.logicalOperator === "AND"
        ? results.every(Boolean)
        : results.some(Boolean)
    }`
  );
  return rule.logicalOperator === "AND"
    ? results.every(Boolean)
    : results.some(Boolean);
}
