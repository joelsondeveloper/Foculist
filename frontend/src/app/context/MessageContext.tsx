"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { AgentRequest, AgentResponse, AgentAction } from "../interfaces/agents";
import { ICategory, ICategoryClient } from "@/models/Category";
import { ITask, ITaskClient } from "@/models/Task";
import { Session } from "next-auth";

export interface ChatMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info" | "agent" | "user";
  timestamp: Date;
  actions?: AgentAction[];
}

const MASTER_PROMPT = `
Você é o **Focuslist Agent**, um assistente de produtividade do aplicativo Focuslist.  
Sua função é ajudar o usuário a gerenciar tarefas e categorias, responder dúvidas e sugerir ações com base no contexto.

⚙️ **SUAS REGRAS DE OURO:**
1. Sua resposta DEVE ser APENAS um **JSON válido**, SEM explicações, textos fora do JSON ou quebras de linha antes/depois.  
2. Não use comentários, aspas erradas ou campos fora do especificado.  
3. Nunca diga “Aqui está o JSON” ou qualquer frase fora dele.  
4. Se não tiver certeza, devolva um JSON com status "error" e uma mensagem explicando o problema.  
5. O JSON DEVE começar com '{' e terminar com '}'.

---

🧩 **Estrutura esperada do JSON (interface TypeScript):**

interface AgentResponse {
  response: {
    status: "success" | "error" | "info" | "agent";
    message: string;
  };
  actions?: AgentAction[];
  status: "idle" | "loading" | "success" | "error";
}

interface AgentAction {
  type: "createTask" | "createCategory" | "deleteTask" | "deleteCategory" |
        "updateTask" | "updateCategory" | "suggestUpgrade" | "info" | "moveTask";
  data?: any;
  tempId?: string;
}

---

🧠 **NOVO: Regras de Automação (AutomationRule)**

interface AutomationRule {
  rules: Array<{
    field: "title" | "description" | "dueDate" | "priority" | "isCompleted" | "status";
    operator: "equals" | "notEquals" | "contains" | "notContains" |
              "lessThan" | "greaterThan" | "between" | "isTrue" | "isFalse" |
              "isPast" | "isFuture" | "isToday" | "isTomorrow" |
              "isNull" | "isNotNull";
    value?: any;
    value2?: any;
  }>;
  logicalOperator: "AND" | "OR";
}

📌 **Categorias Automatizadas:**
- Uma categoria pode ter **automationRule**.
- Se uma task atender a automationRule:
  ➝ Ela deve ser movida automaticamente para aquela categoria.  
- EXCEÇÃO: se a task tiver **userMovedManually: true**, automações NÃO podem movê-la.
- Se o usuário pedir “deixar automático”, enviar **userMovedManually: false**.

📌 **Quando sugerir categorias automáticas:**
Se o usuário falar algo como:
- “Quero uma coluna de atrasadas”
- “Cria uma coluna para tarefas de alta prioridade”
- “Quero separar as concluídas automaticamente”
Você deve sugerir/criar categorias com automationRule.

---

🎯 **Formato ‘data’ esperado em cada ação:**

- **createTask** → { "title": "...", "description": "...", "categoryId": "...", "order"?: number, "dueDate"?: "YYYY-MM-DD", "priority"?: "low" | "medium" | "high", "userMovedManually"?: boolean }

- **updateTask** → { "id": "...", "title"?: "...", "description"?: "...", "status"?: "id_da_nova_categoria", "isCompleted"?: boolean, "dueDate"?: "YYYY-MM-DD" | null, "priority"?: "low" | "medium" | "high", "order"?: number, "userMovedManually"?: boolean | null }

- **createCategory** → { "title": "...", "color": "#HEX", "order"?: number, "automationRule"?: AutomationRule }

- **updateCategory** → { "id": "...", "title"?: "...", "color"?: "#HEX", "order"?: number, "automationRule"?: AutomationRule | null }

- Outros:
  - **moveTask** → igual ao updateTask, mas sem prioridade
  - **deleteTask** → { "id": "..." }
  - **deleteCategory** → { "id": "..." }
  - **suggestUpgrade** → {}
  - **info** → { "message": "..." }

---

🧱 **Drag & Drop (order):**
- O Agent só deve enviar o novo **order** do item que foi movido em tasks ou categorias.
- O backend é responsável por recalcular a ordem dos outros itens automaticamente.
- Se mover para outra categoria → enviar também o novo "status" (id da categoria).


---

🔥 **Prioridade (manual x automática):**
1. Se o usuário não pedir prioridade → NÃO envie \`priority\`.
2. Se o usuário pedir prioridade → envie o valor pedido.
3. Se pedir prioridade automática → OMITA \`priority\`.
4. Não envie isPriorityManual — isso é controlado pelo backend.

---

🔒 **Regra sobre userMovedManually:**
- **true** = usuário moveu manualmente → automações são bloqueadas.
- **false** = automações podem agir.
- Mover manualmente uma task → sempre enviar { userMovedManually: true }.

---

⚠️ **Regras de segurança:**
- Nunca crie tasks sem categoryId.
- Nunca delete tudo sem confirmação.
- Nunca deixe um título vazio.
- Sempre respeite order, prioridade e automações.

---

🚨 **IMPORTANTE:**
- NÃO explique a resposta.
- NÃO coloque texto fora do JSON.
- NÃO use markdown.
- NÃO use comentários.
- Se não entender, devolva:
{"response":{"status":"error","message":"Não consegui entender o pedido."},"status":"error"}

Seu output final deve conter SOMENTE o JSON válido.
`;





interface MessageContextType {
  messages: ChatMessage[];
  addMessage: (
    text: string,
    type?: ChatMessage["type"],
    actions?: ChatMessage["actions"]
  ) => void;
  clearMessages: () => void;
  sendUserMessageToAgent: (userMessage: string) => Promise<void>;
  setDynamicContextData: (
    categories: ICategoryClient[],
    tasks: ITaskClient[],
    refreshData: () => void
  ) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
  session: Session | null;
}

export function MessageProvider({ children, session }: MessageProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [dynamicCategories, setDynamicCategories] = useState<ICategoryClient[]>([]);
  const [dynamicTasks, setDynamicTasks] = useState<ITaskClient[]>([]);
  const [dynamicRefreshData, setDynamicRefreshData] = useState<
    (() => void) | null
  >(null);

  const addMessage = useCallback(
    (
      text: string,
      type: ChatMessage["type"] = "info",
      actions?: ChatMessage["actions"]
    ) => {
      const newMessage: ChatMessage = {
        id: String(new Date().getTime() + Math.random()),
        text,
        type,
        timestamp: new Date(),
        actions,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setDynamicContextData = useCallback(
    (categories: ICategoryClient[], tasks: ITaskClient[], refreshData: () => void) => {
      setDynamicCategories(categories);
      setDynamicTasks(tasks);
      setDynamicRefreshData(() => refreshData);
    },
    []
  );

  const executeAgentAction = useCallback(
    async (actions: ChatMessage["actions"]) => {
      if (!actions || actions.length === 0 || !session?.user?.id) {
        addMessage(
          "Acao do agente nao encontrada ou usuario nao logado",
          "error"
        );
        return;
      }

      const tempIdMap = new Map<string, string>();

      for (const action of actions) {
        let apiEndpoint = "";
        let method = "";
        let body: any = null;
        let successMessage = "";
        let errorMessage = "";

        switch (action.type) {
          case "createTask":
            apiEndpoint = "/api/tasks";
            method = "POST";

            const categoryIdToUse = action.data?.categoryId;
            if (categoryIdToUse && tempIdMap.has(categoryIdToUse)) {
              const realCategoryId = tempIdMap.get(categoryIdToUse);
              if (!realCategoryId) {
                addMessage(
                  `Erro: Categoria temporária '${categoryIdToUse}' não encontrada para criar tarefa.`,
                  "error"
                );
                continue;
              }
              body = {
                title: action.data?.title,
                description: action.data?.description,
                status: realCategoryId,
                dueDate: action.data?.dueDate,
                priority: action.data?.priority,
              };
            } else {
              body = {
                status: categoryIdToUse,
                ...action.data,
              };
            }
            successMessage = `Tarefa "${
              action.data?.title || "desconhecida"
            }" criada com sucesso!`;
            errorMessage = "Falha ao criar tarefa.";
            break;
          case "createCategory":
            apiEndpoint = "/api/categories";
            method = "POST";
            body = action.data;
            successMessage = `Categoria "${
              action.data?.title || "desconhecida"
            }" criada com sucesso!`;
            errorMessage = "Falha ao criar categoria.";
            break;
          case "deleteTask":
            apiEndpoint = `/api/tasks?id=${action.data?.id}`;
            method = "DELETE";
            successMessage = `Tarefa deletada com sucesso!`;
            errorMessage = "Falha ao deletar tarefa.";
            break;
          case "deleteCategory":
            apiEndpoint = `/api/categories?id=${action.data?.id}`;
            method = "DELETE";
            successMessage = `Categoria deletada com sucesso!`;
            errorMessage = "Falha ao deletar categoria.";
            break;
          case "updateTask":
            apiEndpoint = `/api/tasks`;
            method = "PUT";
            body = action.data;
            successMessage = `Tarefa "${
              action.data?.title || "desconhecida"
            }" atualizada com sucesso!`;
            errorMessage = "Falha ao atualizar tarefa.";
            break;
          case "updateCategory":
            apiEndpoint = `/api/categories`;
            method = "PUT";
            body = action.data;
            successMessage = `Categoria "${
              action.data?.title || "desconhecida"
            }" atualizada com sucesso!`;
            errorMessage = "Falha ao atualizar categoria.";
            break;
          case "suggestUpgrade":
            addMessage(
              "Voce pode atualizar para o plano plus para obter mais recursos."
            );
            continue;
          case "info":
            addMessage(action.data?.message || "Informação do agente.", "info");
            continue;
          default:
            addMessage("Acao do agente nao encontrada", "error");
            continue;
        }

        try {
          const res = await fetch(apiEndpoint, {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
          });
          const resData = await res.json();

          if (res.ok && resData.sucess === true) {
            addMessage(successMessage, "success");
            if (
              action.type === "createCategory" &&
              action.tempId &&
              resData.data?._id
            ) {
              tempIdMap.set(action.tempId, resData.data._id);
              
            }
          } else {
            console.warn(
              `🔴 Ação do agente falhou para ${action.type}: res.ok=${
                res.ok
              }, resData.sucess=${resData.sucess}, Backend Message: ${
                resData.message || "Nenhuma mensagem do backend."
              }`
            );
            addMessage(errorMessage, "error");
          }
        } catch (error) {
          console.log(`Erro ao executar acao do agente: ${error}`, error);
          addMessage(errorMessage, "error");
        }
      }
      if (dynamicRefreshData) {
        dynamicRefreshData();
      }
    },
    [addMessage, dynamicRefreshData, session]
  );

  const sendUserMessageToAgent = useCallback(
    async (userMessage: string) => {
      if (!session?.user?.id || !session?.user?.email || !session?.user?.plan) {
        addMessage(
          "Voce precisa estar logado e ter um plano para enviar uma mensagem ao Focuslist Agent",
          "error"
        );
        return;
      }
      addMessage(userMessage, "user");

      if (!dynamicRefreshData) {
        addMessage(
          "Voce precisa atualizar os dados dinamicos para enviar uma mensagem ao Focuslist Agent",
          "error"
        );
        return;
      }

      const agentContext: AgentRequest["context"] = {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        userPlan: session.user.plan,
        categories: dynamicCategories,
        tasks: dynamicTasks,
      };

      const chatHistoryForAgent = messages.slice(-5).map((message) => ({
        type:
          message.type === "user" || message.type === "agent"
            ? message.type
            : "info",
        text: message.text,
      }));

      try {
        const res = await fetch("/api/chatbot-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            masterPrompt: MASTER_PROMPT,
            context: agentContext,
            userMessage,
            chatHistory: chatHistoryForAgent,
          } as AgentRequest),
        });

        const resData: AgentResponse = await res.json();
        

        if (res.ok && resData.status === "success") {
          addMessage(
            resData.response.message,
            resData.response.status,
            resData.actions
          );
          if (resData.actions && resData.actions.length > 0) {
            executeAgentAction(resData.actions);
          }
        } else {
          addMessage(
            resData.response.message ||
              "Ocorreu um erro ao enviar a mensagem ao Focuslist Agent",
            "error"
          );
        }
      } catch (error) {
        console.error("Error sending message to agent:", error);
        addMessage(
          "Ocorreu um erro ao enviar a mensagem ao Focuslist Agent",
          "error"
        );
      }
    },
    [
      session,
      messages,
      dynamicCategories,
      dynamicTasks,
      dynamicRefreshData,
      addMessage,
      executeAgentAction,
    ]
  );

  return (
    <MessageContext.Provider
      value={{
        messages,
        addMessage,
        clearMessages,
        sendUserMessageToAgent,
        setDynamicContextData,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessageProvider");
  }
  return context;
};
