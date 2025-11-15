"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import { ICategory, ICategoryClient } from "@/models/Category";
import { customStyles } from "@/app/utils/customStylesModal";
import RuleBuilder from "../ui/RuleBuilder";
import { AutomationRule } from "@/app/interfaces/automation";
import { useMessages } from "@/app/context/MessageContext";

if (typeof window !== "undefined") {
  Modal.setAppElement("#root");
}

interface CategoryFormData {
  title: string;
  color: string;
  id?: string;
  automationRule?: AutomationRule | null;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  categoryToEdit: ICategoryClient | null;
  onSave: (data: CategoryFormData) => Promise<void>;
  loading: boolean;
  categories: ICategoryClient[];
}

const CategoryFormModal = ({
  isOpen,
  onRequestClose,
  categoryToEdit,
  onSave,
  loading,
  categories,
}: CategoryFormModalProps) => {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#888");
  const [automationRule, setAutomationRule] = useState<AutomationRule | null>(
    null
  );

  const { addMessage } = useMessages();

  useEffect(() => {
    if (categoryToEdit) {
      setTitle(categoryToEdit.title);
      setColor(categoryToEdit.color);
      setAutomationRule(categoryToEdit.automationRule || null);
      console.log("🟡 CategoryFormModal - categoryToEdit:", categoryToEdit); // ADICIONE AQUI
        console.log("🟡 CategoryFormModal - Initial automationRule:", categoryToEdit.automationRule); // E AQUI
    } else {
      setTitle("");
      setColor("#888");
      setAutomationRule(null);
    }
  }, [categoryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      addMessage("Preencha o título da categoria", "error");
      return;
    }
    await onSave({
      id: categoryToEdit ? String(categoryToEdit._id) : undefined,
      title,
      color,
      automationRule: automationRule?.rules?.length ? automationRule : null,
    });
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 min-w-[300px]"
      >
        <h2 className="text-xl font-bold text-center">
          {categoryToEdit ? "Editar Categoria" : "Criar Nova Categoria"}
        </h2>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1A1A2E] text-white rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium mb-1">
            Cor
          </label>
          <input
            id="color"
            type="color" // O input do tipo 'color' abre um seletor de cores!
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded-lg"
          />
        </div>

        <RuleBuilder
          initialRule={automationRule}
          onRuleChange={setAutomationRule}
          categories={categories}
        />

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={onRequestClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 p-2 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 p-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
