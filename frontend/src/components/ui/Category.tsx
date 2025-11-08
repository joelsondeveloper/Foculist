"use client";

import { useState } from "react";
import { ITask } from "@/models/Task";
import { ICategory } from "@/models/Category";
import TaskDetailModal from "../modals/TaskDetailModal";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { useMessages } from "@/app/context/MessageContext";
import { format, isToday, isTomorrow, isPast, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import Button from "./ButtonGeneral";

import {
  Flag,
  CalendarDays,
  MoreHorizontal,
  MoreVertical,
  Check,
} from "lucide-react";

interface CategoryProps {
  title: string;
  color: string;
  data: ITask[];
  refreshData: () => void;
  categories: ICategory[];
  showSettings: () => void;
}

const Category = ({
  title,
  color,
  data,
  refreshData,
  categories,
  showSettings,
}: CategoryProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);

  const { addMessage } = useMessages();

  // 👉 Abre o modal e seleciona a task
  const handleTaskClick = (task: ITask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = async (
    taskData: Partial<ITask> & { id: string }
  ) => {
    try {
      const res = await fetch(`/api/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      const resData = await res.json();

      if (!res.ok) {
        addMessage(
          resData.message || "Falha ao atualizar tarefa. Tente novamente.",
          "error"
        );
        return;
      }

      addMessage(
        `Tarefa "${taskData.title || "sem título"}" atualizada com sucesso!`,
        "success"
      );
      refreshData();
    } catch (error) {
      console.error("Falha ao atualizar tarefa:", error);
      addMessage("Erro ao atualizar a tarefa.", "error");
    }
  };

  const handleUpdateTaskStatus = async (id: string, isCompleted: boolean) => {
    const taskData = { id, isCompleted };
    await handleUpdateTask(taskData);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      const resData = await res.json();

      if (!res.ok) {
        addMessage(
          resData.message || "Falha ao deletar tarefa. Tente novamente.",
          "error"
        );
        return;
      }

      addMessage("Tarefa deletada com sucesso!", "success");
      refreshData();
    } catch (error) {
      console.error("Falha ao deletar tarefa:", error);
      addMessage("Erro ao deletar a tarefa.", "error");
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    if (!isValid(date)) return "";

    const localDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

    if (isToday(localDate)) return "Hoje";
    if (isTomorrow(localDate)) return "Amanhã";
    if (isPast(localDate) && !isToday(localDate))
      return format(localDate, "dd MMM", { locale: ptBR });

    return format(localDate, "dd MMM", { locale: ptBR });
  };

  // 👉 Define cor de prioridade
  const getPriorityColorClass = (priority: ITask["priority"]) => {
    switch (priority) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <>
      <motion.div
        className="flex flex-col gap-4 p-5 bg-primary-foreground/8 rounded-2xl max-w-95 min-w-75 flex-1"
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <header className="flex justify-between items-center" style={{ color }}>
          <div className="flex items-center gap-3">
            <div
              className="w-3 aspect-square rounded-full"
              style={{ background: color }}
            ></div>
            <h3 className="font-semibold">{title}</h3>
          </div>
          <div className="info flex items-center gap-2 aspect-square">
            <button
              className="w-7 aspect-square bg-primary-foreground/8 flex justify-center items-center rounded-lg cursor-pointer"
              onClick={showSettings}
            >
              <MoreHorizontal size="1.25rem" className=" rounded-sm" />
            </button>
            <span className="text-sm font-medium">{data.length}</span>
          </div>
        </header>

        <LayoutGroup>
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {data.map((task) => (
                <motion.div
                  key={String(task._id)}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  // onClick={() => handleTaskClick(task)}
                  role="button"
                  title="Ver detalhes da tarefa"
                  className={`flex flex-col gap-2 p-3  rounded-xl cursor-pointer  transition ${
                    task.isCompleted
                      ? "bg-success hover:bg-success/80"
                      : "bg-primary-foreground hover:bg-primary-foreground/80"
                  }`}
                >
                  <header className="flex items-center gap-2 justify-between">
                    <div
                      className="w-2 aspect-square rounded-full"
                      style={{ background: color }}
                    ></div>
                    <div className="actions flex items-center gap-1">
                      <button
                        className={`w-6 aspect-square rounded-full flex justify-center items-center cursor-pointer ${
                          task.isCompleted
                            ? "bg-primary-foreground text-success"
                            : "bg-success"
                        }`}
                        onClick={() => {
                          handleUpdateTaskStatus(
                            task._id as string,
                            !task.isCompleted
                          );
                        }}
                      >
                        <Check size="1rem" />
                      </button>
                      <button
                        className={`w-7 aspect-square flex justify-center items-center rounded-lg cursor-pointer ${
                          task.isCompleted
                            ? "bg-primary-foreground/8"
                            : "bg-background/5"
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <MoreVertical
                          size="1.25rem"
                          className={` rounded-sm ${
                            task.isCompleted
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                  </header>
                  <div className="content flex flex-col gap-1">
                    <p className="font-semibold text-background">
                      {task.title}
                    </p>

                    <p
                      className={`text-sm ${
                        task.isCompleted
                          ? "line-through"
                          : "text-muted-foreground"
                      }`}
                    >
                      {task.description}
                    </p>
                  </div>

                  <footer
                    className={`flex items-center justify-between text-xs ${
                      task.isCompleted
                        ? "line-through"
                        : "text-muted-foreground"
                    } mt-2`}
                  >
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatDueDate(String(task.dueDate))}
                      </span>
                    )}
                    <span
                      className={`flex items-center gap-1 ${getPriorityColorClass(
                        task.priority
                      )}`}
                    >
                      <Flag size={14} />
                      {task.priority === "low"
                        ? "Baixa"
                        : task.priority === "medium"
                        ? "Média"
                        : "Alta"}
                    </span>
                  </footer>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </motion.div>

      <TaskDetailModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        task={selectedTask}
        categories={categories}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </>
  );
};

export default Category;
