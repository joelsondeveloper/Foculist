"use client";

import { useState } from "react";
import FormField from "../ui/FormField";
import ButtonGeneral from "../ui/ButtonGeneral";
import { ICategory } from "@/models/Category";

import { Plus } from "lucide-react";

interface CreateTaskFormProps {
  onTaskCreated: () => void;
  categories: ICategory[];
}

const CreateTaskForm = ({onTaskCreated, categories}: CreateTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(String(categories[0]?._id) || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, status: selectedCategory }),
      });

      if (!res.ok) {
        throw new Error("Falha ao criar tarefa. Por favor, tente novamente.");
      }

      setTitle("");
      setDescription("");
      onTaskCreated();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao criar a tarefa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="rounded-2xl bg-primary-foreground/8" onSubmit={handleSubmit}>
      <div className="container p-8.5 max-w-105 w-full flex flex-col gap-6 mx-auto">
        <h2 className="font-bold text-xl">Create New Task</h2>
        <div className="formfields flex flex-col gap-4">
          <FormField
            label="Task Title"
            type="text"
            placeholder="Enter your task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormField
            label="Description"
            type="area"
            placeholder="Add detailed description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormField
            label="Category"
            type="select"
            value={selectedCategory}
            options={categories.map((category) => ({
              value: String(category._id),
              label: category.title,
            })
            )}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
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
