import { ITaskClient } from "@/models/Task";

type Priority = "low" | "medium" | "high";

export function calculatePriority(dueDate?: Date | null, isCompleted: boolean = false): Priority {
    if (isCompleted) {
        return "low";
    }

    if (!dueDate) {
        return "low";
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);

    const diffTime = taskDueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return "high";
    } else if (diffDays <= 1) {
        return "high";
    } else if (diffDays <= 7) {
        return "medium";
    } else {
        return "low";
    }
}