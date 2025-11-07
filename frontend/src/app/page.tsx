"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CreateTaskForm from "@/components/layouts/CreateTaskForm";
import TaskCategories from "@/components/layouts/TaskCategories";
import { ITask } from "@/models/Task";
import { ICategory } from "@/models/Category";
import { useMessages } from "./context/MessageContext";

// export const dynamic = "force-dynamic";

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
      if (sessionStatus === "unauthenticated") return

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
        const categoriesError = !categoriesRes.ok ? await categoriesRes.json() : null;
        const errorMessage = tasksError?.message || categoriesError?.message || "Ocorreu um erro ao buscar os dados";
        addMessage(errorMessage, "error");
        throw new Error(errorMessage);
      }

      const tasksData = await tasksRes.json();
      const categoriesData = await categoriesRes.json();

      if (tasksData.sucess) {
        setTasks(tasksData.data);
      } else {
        addMessage(tasksData.message || "Ocorreu um erro ao buscar as tarefas", "error");
      }

      if (categoriesData.sucess) {
        setCategories(categoriesData.data);
      } else {
        addMessage(categoriesData.message || "Ocorreu um erro ao buscar as categorias", "error");
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
  }, [tasks, categories, setDynamicContextData, sessionStatus, loading, fetchData]);

  const handleTaskCreated = () => {
    fetchData();
  };

  // if (sessionStatus !== "authenticated") return null;
  // if (loading) return <div>Carregando...</div>;

  if (!session) {
    return null;
  }

  console.log("🟡 Tasks:", tasks);
  console.log("🟡 Categories:", categories);

  return (
    <main className="app flex flex-col gap-12">
      <CreateTaskForm
        onTaskCreated={handleTaskCreated}
        categories={categories}
      />
      <TaskCategories
        tasks={tasks}
        categories={categories}
        refreshData={fetchData}
      />
    </main>
  );
}
