"use client";

import { useState, useEffect } from "react";
import FormField from "../ui/FormField";
import ButtonGeneral from "../ui/ButtonGeneral";
import { ICategory } from "@/models/Category";

import { Plus } from "lucide-react";
import { useMessages } from "@/app/context/MessageContext";
import { u } from "framer-motion/client";

interface CreateTaskFormProps {
  onTaskCreated: () => void;
  categories: ICategory[];
}

const CreateTaskForm = ({ onTaskCreated, categories }: CreateTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">('medium');
  const [dueDate, setDueDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { addMessage } = useMessages();

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(String(categories[0]?._id));
    }
  }, [categories, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !description) {
      addMessage("Preencha todos os campos", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, status: selectedCategory, priority, dueDate: dueDate || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage(
          data.message || "Ocorreu um erro ao criar a tarefa",
          "error"
        );
        return;
      }

      addMessage(`Tarefa "${title}" criada com sucesso`, "success");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      onTaskCreated();
    } catch (error) {
      console.error("Error creating task:", error);
      addMessage("Ocorreu um erro ao criar a tarefa", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="rounded-2xl bg-primary-foreground/8"
      onSubmit={handleSubmit}
    >
      <div className="container p-8.5 max-w-105 w-full flex flex-col gap-6 mx-auto">
        <h2 className="font-bold text-xl">Criar Nova Tarefa</h2>
        <div className="formfields flex flex-col gap-4">
          <FormField
            label="Título da Tarefa"
            type="text"
            placeholder="Enter your task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <FormField
            label="Descrição"
            type="area"
            placeholder="Add detailed description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {categories.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma categoria disponível</p>
          ) : (
            <FormField
              label="Categoria"
              type="select"
              value={selectedCategory}
              options={categories.map((c) => ({
                value: String(c._id),
                label: c.title,
              }))}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
            />
          )}
        </div>
        <FormField
          label="Prioridade"
          type="select"
          value={priority}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
        />
        <FormField
          label="Data Limite"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {/* {error && <p className="text-red-500 text-sm text-center">{error}</p>} */}
        <ButtonGeneral color="bg-success" type="submit" disabled={loading}>
          {loading ? (
            <span>Adicionando...</span>
          ) : (
            <div className="flex items-center gap-2">
              <Plus />
              <span>Adicionar</span>
            </div>
          )}
        </ButtonGeneral>
      </div>
    </form>
  );
};

export default CreateTaskForm;
