import { useState } from "react";
import Category from "../ui/Category";
import { ITask } from "@/models/Task";
import { ICategory } from "@/models/Category";
import CategorySettingsModal from "../modals/CategorySettingsModal";
import CategoryFormModal from "../modals/CategoryFormModal";
import ButtonGeneral from "../ui/ButtonGeneral";

interface TaskCategories {
  tasks: ITask[];
  categories: ICategory[];
  refreshData: () => void;
}

const TaskCategories = ({ tasks, categories, refreshData }: TaskCategories) => {
  const [moadlIsOpen, setModalIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  );
  const [formModalIsOpen, setFormModalIsOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ICategory | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenCreateForm = () => {
    setFormModalIsOpen(true);
    setCategoryToEdit(null);
  };

  const handleOpenEditForm = (category: ICategory) => {
    setFormModalIsOpen(true);
    setCategoryToEdit(category);
  };

  const handleCloseForm = () => {
    setFormModalIsOpen(false);
    setCategoryToEdit(null);
  };

  const handleSaveCategory = async (data: { title: string; color: string; id?: string }) => {
    setSaving(true);
    const { id, title, color } = data;

    console.log("🟡 Salvando categoria:", { id, title, color });

    const method = id && id.trim() !== "" ? "PUT" : "POST";



    const body = JSON.stringify({ id, title, color });
    try {
      const res = await fetch("/api/categories", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Falha ao salvar categoria");

      }

      handleCloseForm();
        refreshData();
    } catch (error) {
      console.log("Falha ao salvar categoria:", error);
    }
    setSaving(false);
  };

  const handleOpenSettings = (category: ICategory) => {
    setSelectedCategory(category);
    setModalIsOpen(true);
  };

  const handleCloseSettings = () => {
    setSelectedCategory(null);
    setModalIsOpen(false);
  };

  const handleEditCategory = async (category: ICategory) => {
    handleCloseSettings();
    setCategoryToEdit(category);
    setFormModalIsOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error( error.message || "Falha ao deletar categoria");
      }
      refreshData();
    } catch (error) {
      console.log("Falha ao deletar categoria:", error);
    }
  };

  return (
    <>
    <section className="flex flex-col gap-6">
      <header className="flex justify-between">
        <h2 className="text-center text-xl">Task Categories</h2>
        <div className="container w-fit">
            <ButtonGeneral color="bg-success" onClick={handleOpenCreateForm} >New Category</ButtonGeneral>
        </div>
      </header>
      <div className="categories flex gap-5 overflow-x-auto">
        {categories.map((category) => {
            const tasksInCategory = tasks.filter(task => task.status === String(category._id));
            
            return (
              <div
                key={category._id as string}
                onDoubleClick={() => handleOpenSettings(category)}
                className="cursor-pointer" // Indica que é clicável
              >
                <Category title={category.title} color={category.color} data={tasksInCategory} refreshData={refreshData} categories={categories} />
              </div>
            );
          })}
      </div>
    </section>
    <CategorySettingsModal
      isOpen={moadlIsOpen}
      onRequestClose={handleCloseSettings}
      category={selectedCategory}
      onEdit={handleEditCategory}
      onDelete={handleDeleteCategory}
    />
    <CategoryFormModal
      isOpen={formModalIsOpen}
      onRequestClose={handleCloseForm}
      categoryToEdit={categoryToEdit}
      onSave={handleSaveCategory}
      loading={saving}
    />
    </>
  );
};

export default TaskCategories;
