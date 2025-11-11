"use client";

import { useState, useCallback, useRef } from "react";
import { ITask, ITaskClient } from "@/models/Task";
import { ICategory, ICategoryClient } from "@/models/Category";
import TaskDetailModal from "../modals/TaskDetailModal";
import { useMessages } from "@/app/context/MessageContext";

import {
  Droppable,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";

import {
  MoreHorizontal,
} from "lucide-react";
import Task from "./Task";

interface CategoryProps {
  title: string;
  color: string;
  data: ITaskClient[];
  refreshData: () => void;
  categories: ICategoryClient[];
  showSettings: () => void;
  categoryId: string;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

const Category = ({
  title,
  color,
  data: tasks,
  refreshData,
  categories,
  categoryId,
  showSettings,
  provided,
  snapshot,
}: CategoryProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITaskClient | null>(null);

  const { addMessage } = useMessages();

  // 👉 Abre o modal e seleciona a task
  const handleTaskClick = (task: ITaskClient) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = async (
    taskData: Partial<ITaskClient> & { id: string }
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

  // 👉 Define cor de prioridade
  const getPriorityColorClass = (priority: ITaskClient["priority"]) => {
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

  const framerRef = useRef<HTMLDivElement>(null);

  const setCombineRef = useCallback(
    (node: HTMLDivElement | null) => {
      const innerRef = provided.innerRef;
      const framer = framerRef;
      if (innerRef) {
        if (typeof innerRef === "function") {
          innerRef(node);
        } else if ("current" in innerRef) {
        // eslint-disable-next-line react-hooks/immutability
        (innerRef as React.RefObject<HTMLDivElement | null>).current = node;
      }
      }

      if (framer && "current" in framer) {
      framer.current = node;
    }
  },
    [provided.innerRef]
  );

  return (
    <>
      <div ref={setCombineRef} {...provided.draggableProps}>
        <div
          className={`flex flex-col gap-4 p-5 bg-primary-foreground/8 rounded-2xl max-w-95 min-w-75 flex-1 ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : "" // Feedback visual ao arrastar a coluna
          }`}
        >
          <header
            className="flex justify-between items-center"
            style={{ color }}
            {...provided.dragHandleProps}
          >
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
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size="1.25rem" className=" rounded-sm" />
              </button>
              <span className="text-sm font-medium">{tasks.length}</span>
            </div>
          </header>

            <Droppable droppableId={categoryId} type="task">
              {(providedInnerDroppable, snapshotInnerDroppable) => (
                <div
                  className={`flex flex-col gap-2 p-1 ${
                    tasks.length === 0
                      ? "min-h-[100px] border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center text-muted-foreground"
                      : ""
                  } ${
                    snapshotInnerDroppable.isDraggingOver ? "bg-primary-foreground/10" : ""
                  }`}
                  ref={providedInnerDroppable.innerRef}
                  {...providedInnerDroppable.droppableProps}
                >
                  {/* <AnimatePresence mode="popLayout"> */}
                  {tasks.map((task, index) => (
                    <Task
                      key={String(task._id)}
                      task={task}
                      index={index}
                      color={color}
                      handleUpdateTaskStatus={handleUpdateTaskStatus}
                      handleTaskClick={handleTaskClick}
                      getPriorityColorClass={getPriorityColorClass}
                    />
                  ))}
                  {/* </AnimatePresence> */}
                  {providedInnerDroppable.placeholder}
                </div>
              )}
            </Droppable>
        </div>
      </div>

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
