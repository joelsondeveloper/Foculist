import { ICategory } from "@/models/Category";
import { ITask } from "@/models/Task";

export interface AgentRequest {
  masterPrompt: string;
  context: {
    userId: string;
    userName: string;
    userEmail: string;
    userPlan: string;
    categories: ICategory[];
    tasks: ITask[];
  };
  userMessage: string;
  chatHistory: Array<{
    type: "user" | "agent";
    text: string;
  }>;
}

export interface AgentAction {
  type:
    | "createTask"
    | "createCategory"
    | "deleteTask"
    | "deleteCategory"
    | "updateTask"
    | "updateCategory"
    | "suggestUpgrade"
    | "info";
  data?: any;
  tempId?: string;
}

export interface AgentResponse {
  response: {
    status: "success" | "error" | "info" | "agent";
    message: string;
  };
  actions?: AgentAction[];
  status: "idle" | "loading" | "success" | "error";
}
