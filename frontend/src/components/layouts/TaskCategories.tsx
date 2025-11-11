import { useState } from "react";
import Category from "../ui/Category";
import { ITask, ITaskClient } from "@/models/Task";
import { ICategory, ICategoryClient } from "@/models/Category";
import CategorySettingsModal from "../modals/CategorySettingsModal";
import CategoryFormModal from "../modals/CategoryFormModal";
import ButtonGeneral from "../ui/ButtonGeneral";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useMessages } from "@/app/context/MessageContext";

interface TaskCategories {
  tasks: { [key: string]: ITaskClient[] };
  categories: ICategoryClient[];
  refreshData: () => void;
  onCategoriesReordered: (newCategories: ICategoryClient[]) => Promise<void>;
}

const TaskCategories = ({ tasks, categories, refreshData }: TaskCategories) => {
  const [moadlIsOpen, setModalIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategoryClient | null>(
    null
  );
  const [formModalIsOpen, setFormModalIsOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ICategoryClient | null>(null);
  const [saving, setSaving] = useState(false);

  const { addMessage } = useMessages();

  const handleOpenCreateForm = () => {
    setFormModalIsOpen(true);
    setCategoryToEdit(null);
  };

  const handleCloseForm = () => {
    setFormModalIsOpen(false);
    setCategoryToEdit(null);
  };

  const handleSaveCategory = async (data: {
    title: string;
    color: string;
    id?: string;
  }) => {
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
        console.error("Erro ao salvar categoria:", error);
        addMessage(error.message || "Falha ao salvar categoria", "error");
        return;
      }

      handleCloseForm();
      refreshData();
    } catch (error) {
      console.log("Falha ao salvar categoria:", error);
      addMessage("Erro ao salvar categoria", "error");
    }
    setSaving(false);
  };

  const handleOpenSettings = (category: ICategoryClient) => {
    setSelectedCategory(category);
    setModalIsOpen(true);
  };

  const handleCloseSettings = () => {
    setSelectedCategory(null);
    setModalIsOpen(false);
  };

  const handleEditCategory = async (category: ICategoryClient) => {
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
        console.error("Erro ao deletar categoria:", error);
        addMessage(error.message || "Falha ao deletar categoria", "error");
        return;
      }
      refreshData();
    } catch (error) {
      console.log("Falha ao deletar categoria:", error);
      addMessage("Erro ao deletar categoria", "error");
    }
  };

  // const tasksByCategoryId: { [key: string]: ITask[] } = categories.reduce(
  //   (acc, category) => {
  //     acc[String(category._id)] = tasks
  //       .filter((task) => String(task.status) === String(category._id))
  //       .sort((a, b) => a.order - b.order);
  //     return acc;
  //   },
  //   {} as { [key: string]: ITask[] }
  // );

  return (
    <>
      <section className="flex flex-col gap-6">
        <header className="flex justify-between">
          <h2 className="text-center text-xl">Task Categories</h2>
          <div className="container w-fit">
            <ButtonGeneral color="bg-success" onClick={handleOpenCreateForm}>
              New Category
            </ButtonGeneral>
          </div>
        </header>
        <Droppable
          droppableId="all-categories"
          direction="horizontal"
          type="category"
        >
          {(provided, snapshot) => (
            <div
              className={`categories flex gap-5 overflow-x-auto ${
            snapshot.isDraggingOver ? 'bg-gray-700/10' : ''
          }`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {categories.map((category, index) => (
                <Draggable key={String(category._id)} draggableId={String(category._id)} index={index}>
                  {(providedDraggable, snapshotDraggable) => (
                    <div
                      ref={providedDraggable.innerRef}
                      onDoubleClick={() => handleOpenSettings(category)}
                      className={` cursor-pointer
                        ${snapshotDraggable.isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''}
                      `}
                    >
                      <Category
                        title={category.title}
                        color={category.color}
                        data={tasks[String(category._id)] || []}
                        refreshData={refreshData}
                        categories={categories}
                        showSettings={() => handleOpenSettings(category)}
                        categoryId={String(category._id)}
                        provided={providedDraggable}
                        snapshot={snapshotDraggable}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
          {provided.placeholder}
            </div>
          )}
        </Droppable>
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
