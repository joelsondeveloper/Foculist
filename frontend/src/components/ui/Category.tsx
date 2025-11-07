"use client";

import { useState } from "react";
import { ITask } from "@/models/Task";
import { ICategory } from "@/models/Category";
import TaskDetailModal from "../modals/TaskDetailModal";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";

interface CategoryProps {
  title: string;
  color: string;
  data: ITask[];
  refreshData: () => void;
  categories: ICategory[];
}

const Category = ({
  title,
  color,
  data,
  refreshData,
  categories,
}: CategoryProps) => {
  const [taskDetailModalIsOpen, setTaskDetailModalIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);

  const handleTaskClick = (task: ITask) => {
    setSelectedTask(task);
    setTaskDetailModalIsOpen(true);
  };

  const handleUpdateTask = async (
    taskData: Partial<ITask> & { id: string }
  ) => {
    try {
      const res = await fetch(`/api/tasks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) {
        throw new Error(
          "Falha ao atualizar tarefa. Por favor, tente novamente."
        );
      }
      refreshData();
    } catch (error) {
      console.log("Falha ao atualizar tarefa:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Falha ao deletar tarefa. Por favor, tente novamente.");
      }
      refreshData();
    } catch (error) {
      console.log("Falha ao deletar tarefa:", error);
    }
  };

  return (
    <>
      <motion.div
        className="flex flex-col gap-4 p-5 bg-primary-foreground/8 rounded-2xl max-w-60 w-max flex-1 mask-linear-to-yellow-50"
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <header className={`flex justify-between`} style={{ color }}>
          <div className="title flex items-center gap-2">
            <div
              className={`dot w-2 aspect-square rounded-full`}
              style={{ background: color }}
            ></div>
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <div className="total font=medium text-sm">{data.length}</div>
        </header>
        <LayoutGroup>
          <div className="tasks flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {data.map((task, index) => (
                <motion.div
                  className="task flex items-center gap-3 p-3 bg-primary-foreground rounded-xl"
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  onClick={() => handleTaskClick(task)}
                >
                  <div
                    className="dot w-2 aspect-square rounded-full"
                    style={{ background: color }}
                  ></div>
                  <div className="info flex-1">
                    <p className="font-medium text-sm text-muted">
                      {task.title}
                    </p>
                    <p className="text-xs text-border">{task.description}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </motion.div>

      <TaskDetailModal
        isOpen={taskDetailModalIsOpen}
        onRequestClose={() => setTaskDetailModalIsOpen(false)}
        task={selectedTask}
        categories={categories}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </>
  );
};

export default Category;
