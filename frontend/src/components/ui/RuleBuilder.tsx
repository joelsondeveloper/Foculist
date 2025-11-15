"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  AutomationRule,
  Rule,
  RuleField,
  RuleOperator,
  fieldOptions,
  operatorOptions,
  priorityOptions,
} from "@/app/interfaces/automation";
import { ICategoryClient } from "@/models/Category";
import { Trash, Plus } from "lucide-react";
import ButtonGeneral from "../ui/ButtonGeneral";

interface RuleBuilderProps {
  initialRule?: AutomationRule | null;
  onRuleChange?: (rule: AutomationRule | null) => void;
  categories: ICategoryClient[];
}

const RuleBuilder = ({
  initialRule,
  onRuleChange,
  categories,
}: RuleBuilderProps) => {
  const [currentRule, setCurrentRule] = useState<AutomationRule>(
    initialRule || { rules: [], logicalOperator: "AND" }
  );

  useEffect(() => {
    setCurrentRule(initialRule || { rules: [], logicalOperator: "AND" });
  }, [initialRule]);

  const handleRuleChange = useCallback(() => {
    onRuleChange?.(currentRule.rules.length > 0 ? currentRule : null);
  }, [currentRule, onRuleChange]);

  useEffect(() => {
    handleRuleChange();
  }, [handleRuleChange]);

  const addRule = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentRule((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        { field: "title", operator: "contains", value: "" },
      ],
    }));
  }, []);

  const removeRule = useCallback((index: number) => {
    setCurrentRule((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  }, []);

  const updateRule = useCallback((index: number, newRule: Partial<Rule>) => {
    setCurrentRule((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, ...newRule } : rule
      ),
    }));
  }, []);

  const getSupportedOperators = useCallback ( (field: RuleField) => {
    const fieldType = fieldOptions.find((f) => f.value === field)?.type;
    if (!fieldType) return [];
    return operatorOptions.filter((o) => o.supportedTypes.includes(fieldType));
  }, []);

  const getInputField = useCallback( (rule: Rule, index: number) => {
    const fieldType = fieldOptions.find((f) => f.value === rule.field)?.type;

    switch (fieldType) {
      case "string":
        return (
          <input
            type="text"
            value={rule.value || ""}
            onChange={(e) => updateRule(index, { value: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Valor"
          />
        );

      case "date":
        if (
          ["isPast", "isFuture", "isToday", "isTomorrow"].includes(
            rule.operator
          )
        ) {
          return null;
        }

        const dateValue =
          rule.value instanceof Date
            ? rule.value.toISOString().split("T")[0]
            : typeof rule.value === "string" &&
              rule.value.match(/^\d{4}-\d{2}-\d{2}$/)
            ? rule.value
            : "";

        return (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => updateRule(index, { value: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        );

      case "priority":
        return (
          <select
            value={rule.value || "low"}
            onChange={(e) =>
              updateRule(index, {
                value: e.target.value as "low" | "medium" | "high",
              })
            }
            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "boolean":
        return (
          <select
            value={String(rule.value) || "false"}
            onChange={(e) =>
              updateRule(index, { value: e.target.value === "true" })
            }
            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="true">Verdadeiro</option>
            <option value="false">Falso</option>
          </select>
        );

      case "category":
        return (
          <select
            value={rule.value || ""}
            onChange={(e) => updateRule(index, { value: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione a Categoria</option>
            {categories.map((cat) => (
              <option key={String(cat._id)} value={String(cat._id)}>
                {cat.title}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-gray-800 text-white">
      <h3 className="text-lg font-semibold mb-2">Regra de Automação</h3>

      {currentRule.rules.length === 0 && (
        <p className="text-gray-400 text-sm">
          Nenhuma regra definida. Clique em &quot;Adicionar Regra&quot; para
          começar.
        </p>
      )}

      {currentRule.rules.map((rule, index) => (
        <div
          key={index}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-3 bg-gray-700 rounded-md"

        >
          {/* FIELD */}
          <select
            value={rule.field}
            onChange={(e) =>
              updateRule(index, {
                field: e.target.value as RuleField,
                operator: "equals",
                value: "",
              })
            }
            className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
          >
            {fieldOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* OPERATOR */}
          <select
            value={rule.operator}
            onChange={(e) =>
              updateRule(index, {
                operator: e.target.value as RuleOperator,
                value: "",
                value2: "",
              })
            }
            className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
          >
            {getSupportedOperators(rule.field).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* VALUE */}
          {getInputField(rule, index)}

          {/* VALUE2 */}
          {rule.operator === "between" && rule.field === "dueDate" && (
            <input
              type="date"
              value={rule.value2 || ""}
              onChange={(e) => updateRule(index, { value2: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-md px-3 py-2"
            />
          )}

          <button
            onClick={() => removeRule(index)}
            className="p-2 text-red-500 hover:text-red-400"
          >
            <Trash size={20} />
          </button>
        </div>
      ))}

      {/* AND / OR */}
      <div className="flex justify-between items-center mt-2">
        <ButtonGeneral
          onClick={addRule}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={20} /> Adicionar Regra
        </ButtonGeneral>

        {currentRule.rules.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Combinar regras com:</span>
            <select
              value={currentRule.logicalOperator}
              onChange={(e) =>
                setCurrentRule((prev) => ({
                  ...prev,
                  logicalOperator: e.target.value as "AND" | "OR",
                }))
              }
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleBuilder;
