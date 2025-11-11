"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CreateTaskForm from "@/components/layouts/CreateTaskForm";
import TaskCategories from "@/components/layouts/TaskCategories";
import { ITask, ITaskClient } from "@/models/Task";
import { ICategory } from "@/models/Category";
import { useMessages } from "./context/MessageContext";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  const { setDynamicContextData, addMessage } = useMessages();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (sessionStatus === "unauthenticated") return;

      const [tasksRes, categoriesRes] = await Promise.all([
        fetch("/api/tasks", {
          method: "GET",
          credentials: "include",
          cache: "no-cache",
        }),
        fetch("/api/categories", {
          method: "GET",
          credentials: "include",
          cache: "no-cache",
        }),
      ]);

      if (!tasksRes.ok || !categoriesRes.ok) {
        const tasksError = !tasksRes.ok ? await tasksRes.json() : null;
        const categoriesError = !categoriesRes.ok
          ? await categoriesRes.json()
          : null;
        const errorMessage =
          tasksError?.message ||
          categoriesError?.message ||
          "Ocorreu um erro ao buscar os dados";
        addMessage(errorMessage, "error");
        throw new Error(errorMessage);
      }

      const tasksData = await tasksRes.json();
      const categoriesData = await categoriesRes.json();

      if (tasksData.sucess) {
        setTasks(tasksData.data);
      } else {
        addMessage(
          tasksData.message || "Ocorreu um erro ao buscar as tarefas",
          "error"
        );
      }

      if (categoriesData.sucess) {
        setCategories(
          categoriesData.data.sort(
            (a: ICategory, b: ICategory) => a.order - b.order
          )
        );
      } else {
        addMessage(
          categoriesData.message || "Ocorreu um erro ao buscar as categorias",
          "error"
        );
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      addMessage("Ocorreu um erro ao buscar os dados", "error");
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, addMessage]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }

    if (sessionStatus === "authenticated") {
      fetchData();
    }
  }, [sessionStatus, router, fetchData]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && !loading) {
      setDynamicContextData(categories, tasks, fetchData);
    }
  }, [
    tasks,
    categories,
    setDynamicContextData,
    sessionStatus,
    loading,
    fetchData,
  ]);

  const handleTaskCreated = () => {
    fetchData();
  };

  const onCategoriesReordered = useCallback(
    async (newCategories: ICategory[]) => {
      const updatePromises: Promise<Response>[] = [];

      newCategories.forEach((category, index) => {
        if (category.order !== index) {
          updatePromises.push(
            fetch(`/api/categories`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id: String(category._id), order: index }),
            })
          );
        }
      });

      try {
        await Promise.all(updatePromises);
        addMessage("Categorias atualizadas com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao atualizar categorias:", error);
        addMessage("Erro ao atualizar categorias.", "error");
        fetchData();
      }
    },
    [addMessage, fetchData]
  );

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "category") {
      const originalCategories = Array.from(categories);
      const newCategories = Array.from(categories);
      const [reorderedCategory] = newCategories.splice(source.index, 1);
      newCategories.splice(destination.index, 0, reorderedCategory);

      setCategories(
        newCategories.map((cat, index) => ({ ...cat, order: index }))
      );

      try {
        await onCategoriesReordered(
          newCategories.map((cat, index) => ({ ...cat, order: index }))
        );
      } catch (error) {
        console.error("Erro ao reordenar categorias no backend:", error);
        addMessage("Erro ao reordenar categorias. Revertendo...", "error");
        setCategories(originalCategories);
        fetchData();
      }

      return;
    }

    const originalTasks = Array.from(tasks);

    const startCategory = categories.find(
      (cat) => String(cat._id) === source.droppableId
    );
    const finishCategory = categories.find(
      (cat) => String(cat._id) === destination.droppableId
    );

    if (!startCategory || !finishCategory) {
      addMessage(
        "Erro: Categoria de origem ou destino não encontrada.",
        "error"
      );
      return;
    }

    const draggedTask = tasks.find((task) => String(task._id) === draggableId);
    if (!draggedTask) {
      addMessage("Erro: Tarefa arrastada não encontrada.", "error");
      return;
    }

    const otherTasks = tasks.filter(
      (task) =>
        String(task.status) !== String(startCategory._id) &&
        String(task.status) !== String(finishCategory._id)
    );

    const sourceTasksInPlay = tasks
      .filter(
        (task) =>
          String(task.status) === String(startCategory._id) &&
          String(task._id) !== draggableId
      )
      .sort((a, b) => a.order - b.order);

    const destinationTasksInPlay = tasks
      .filter(
        (task) =>
          String(task.status) === String(finishCategory._id) &&
          String(task._id) !== draggableId
      )
      .sort((a, b) => a.order - b.order);

    const movedTaskClone: ITaskClient = {
      ...draggedTask,
      status: String(finishCategory._id),
    };

    let finalSourceTasks: ITask[] = [];
    let finalDestinationTasks: ITask[] = [];

    if (source.droppableId === destination.droppableId) {
      finalSourceTasks = Array.from(sourceTasksInPlay);
      finalSourceTasks.splice(destination.index, 0, movedTaskClone);
      finalDestinationTasks = [];
    } else {
      finalSourceTasks = Array.from(sourceTasksInPlay);
      finalDestinationTasks = Array.from(destinationTasksInPlay);
      finalDestinationTasks.splice(destination.index, 0, movedTaskClone);
    }

    finalSourceTasks = finalSourceTasks.map((task, index) => ({
      ...task,
      order: index,
      status: String(startCategory._id),
    }));

    finalDestinationTasks = finalDestinationTasks.map((task, index) => ({
      ...task,
      order: index,
      status: String(finishCategory._id),
    }));

    const newTasksState = [
      ...otherTasks,
      ...finalSourceTasks,
      ...finalDestinationTasks,
    ];

    setTasks(newTasksState);

    try {
      const tasksToUpdatePromises: Promise<Response>[] = [];

      newTasksState.forEach((newTask) => {
        const originalTask = originalTasks.find(
          (ot) => String(ot._id) === String(newTask._id)
        );

        if (
          !originalTask ||
          originalTask.status !== newTask.status ||
          originalTask.order !== newTask.order
        ) {
          tasksToUpdatePromises.push(
            fetch(`/api/tasks`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: String(newTask._id),
                status: String(newTask.status),
                order: newTask.order,
              }),
            })
          );
        }
      });

      await Promise.all(tasksToUpdatePromises);

      addMessage("Tarefa movida e ordem atualizada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao salvar movimento de tarefa:", error);
      addMessage("Erro ao salvar movimento de tarefa. Revertendo...", "error");
      setTasks(originalTasks);
      fetchData();
    }
  };

  if (!session) {
    return null;
  }

  const tasksByCategoryId: { [key: string]: ITask[] } = categories.reduce(
    (acc, category) => {
      acc[String(category._id)] = tasks
        .filter((task) => String(task.status) === String(category._id))
        .sort((a, b) => a.order - b.order);
      return acc;
    },
    {} as { [key: string]: ITask[] }
  );

  return (
    <main className="app flex flex-col gap-12">
      <CreateTaskForm
        onTaskCreated={handleTaskCreated}
        categories={categories}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <TaskCategories
          tasks={tasksByCategoryId}
          categories={categories}
          refreshData={fetchData}
          onCategoriesReordered={onCategoriesReordered}
        />
      </DragDropContext>
    </main>
  );
}
