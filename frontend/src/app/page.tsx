"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CreateTaskForm from "@/components/layouts/CreateTaskForm";
import TaskCategories from "@/components/layouts/TaskCategories";
import { ITask } from "@/models/Task";
import { ICategory } from "@/models/Category";

export const dynamic = "force-dynamic";

export default function Home() {

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, categoriesRes] = await Promise.all([
        fetch("/api/tasks", { method: "GET", credentials: "include" }),
        fetch("/api/categories", { method: "GET", credentials: "include" }),
      ])

      if (!tasksRes.ok || !categoriesRes.ok) {
        throw new Error("Falha ao buscar tarefas e categorias.");
      }

      const tasksData = await tasksRes.json();
      const categoriesData = await categoriesRes.json();

      if (tasksData.sucess) {
        setTasks(tasksData.data);
      }

      if (categoriesData.sucess) {
        setCategories(categoriesData.data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }

    if (sessionStatus === "authenticated") {
      fetchData();
    }
  }, [sessionStatus, router, fetchData]);

  const handleTaskCreated = () => {
    fetchData();
  };

  if (sessionStatus === "loading" || loading) {
    return <div>Carregando...</div>;
  }

  if (!session) {
    return null;
  }

  console.log("🟡 Tasks:", tasks);
  console.log("🟡 Categories:", categories);

  return (
    <main className="app flex flex-col gap-12">
      <CreateTaskForm onTaskCreated={handleTaskCreated} categories={categories} />
      <TaskCategories tasks={tasks} categories={categories} refreshData={fetchData} />
    </main>
  );
}
