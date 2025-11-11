"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { ITask, ITaskClient } from "@/models/Task";
import { Check, MoreVertical, Flag, CalendarDays } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculatePriority } from "@/lib/taskPriorityUtils";

interface TaskProps {
  task: ITaskClient;
  index: number;
  color: string;
  handleUpdateTaskStatus: (id: string, isCompleted: boolean) => void;
  handleTaskClick: (task: ITaskClient) => void;
  getPriorityColorClass: (priority: ITask["priority"]) => string;
}

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

const Task = ({
  task,
  index,
  color,
  handleUpdateTaskStatus,
  handleTaskClick,
  getPriorityColorClass,
}: TaskProps) => {
  return (
    <Draggable
      key={String(task._id)}
      draggableId={String(task._id)}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          role="button"
          title="Ver detalhes da tarefa"
          className={`flex flex-col gap-2 p-3 rounded-xl cursor-pointer ${
            task.isCompleted
              ? "bg-success hover:bg-success/80"
              : "bg-primary-foreground hover:bg-primary-foreground/80"
          } ${snapshot.isDragging ? "shadow-lg ring-2 ring-indigo-500" : ""}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
          }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateTaskStatus(task._id as string, !task.isCompleted);
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(task);
                }}
              >
                <MoreVertical
                  size="1.25rem"
                  className={`rounded-sm ${
                    task.isCompleted
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            </div>
          </header>
          <div className="content flex flex-col gap-1">
            <p className="font-semibold text-background">{task.title}</p>
            <p
              className={`text-sm ${
                task.isCompleted ? "line-through" : "text-muted-foreground"
              }`}
            >
              {task.description}
            </p>
          </div>
          <footer
            className={`flex items-center justify-between text-xs ${
              task.isCompleted ? "line-through" : "text-muted-foreground"
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
                task.isPriorityManual
                  ? task.priority || "medium"
                  : calculatePriority(task.dueDate, task.isCompleted)
              )}`}
            >
              <Flag size={14} />
              {task.isPriorityManual
                ? task.priority === "low"
                  ? "Baixa"
                  : task.priority === "medium"
                  ? "Média"
                  : task.priority === "high"
                  ? "Alta"
                  : "N/A"
                : calculatePriority(task.dueDate, task.isCompleted) === "low"
                ? "Baixa"
                : calculatePriority(task.dueDate, task.isCompleted) === "medium"
                ? "Média"
                : "Alta"}
            </span>
          </footer>
        </div>
      )}
    </Draggable>
  );
};

export default Task;
