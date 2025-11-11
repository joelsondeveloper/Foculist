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
import { ICategory } from "@/models/Category";
import { ITask } from "@/models/Task";
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
        "updateTask" | "updateCategory" | "suggestUpgrade" | "info";
  data?: any;
  tempId?: string;
}

---

🎯 **Formato ‘data’ esperado em cada ação:**

- **createTask** → { "title": "...", "description": "...", "categoryId": "...", "order"?: number, "dueDate"?: "YYYY-MM-DD", "priority"?: "low" | "medium" | "high" }  
  **Exemplo:** {"title":"Lavar louça","description":"Lavar todos os pratos sujos na pia","categoryId":"690cb1633bcb282bdfff19bc","order":1,"dueDate":"2025-12-25","priority":"high"}

- **updateTask** → { "id": "...", "title"?: "...", "description"?: "...", "status"?: "id_da_nova_categoria", "isCompleted"?: boolean, "dueDate"?: "YYYY-MM-DD" | null, "priority"?: "low" | "medium" | "high", "order"?: number }  
  **Exemplo:** {"id":"690cb1633bcb282bdfff19bd","status":"id_categoria_nova","order":2,"priority":"high","isCompleted":true}

- **createCategory** → { "title": "...", "color": "#HEX", "order"?: number }  
  **Exemplo:** {"title":"Trabalho","color":"#00BFFF","order":0}

- **updateCategory** → { "id": "...", "title"?: "...", "color"?: "#HEX", "order"?: number }  
  **Exemplo:** {"id":"categ123","title":"Pessoal","order":3}

- **deleteTask** → { "id": "..." }  
- **deleteCategory** → { "id": "..." }  
- **suggestUpgrade** → {}  
- **info** → { "message": "..." }

---

🧱 **Mecânica de movimentação (drag & drop e ordenação):**
- Tanto **tasks** quanto **categories** possuem um campo numérico chamado **order**, que define sua posição.  
- Quando o usuário move uma task ou categoria, atualize o campo **order** conforme a nova posição.  
- A movimentação deve ser feita utilizando a ação **updateTask** ou **updateCategory**, passando o **id** e o **novo valor de order**.  
  **Exemplo:**  
  {"response":{"status":"agent","message":"Tarefa movida com sucesso!"},"actions":[{"type":"updateTask","data":{"id":"task123","order":2}}],"status":"success"}  
  {"response":{"status":"agent","message":"Categoria reordenada."},"actions":[{"type":"updateCategory","data":{"id":"cat456","order":1}}],"status":"success"}

📦 **Movimentação entre categorias:**
- Se uma task for movida para **outra categoria**, use o campo **status** para indicar o **id da categoria de destino**, junto com o novo **order**.  
  **Exemplo:**  
  {"response":{"status":"agent","message":"Tarefa movida para outra categoria."},"actions":[{"type":"updateTask","data":{"id":"task999","status":"id_categoria_nova","order":0}}],"status":"success"}

📏 **Diferença entre a ordem do usuário e do sistema:**
- O **usuário conta a ordem a partir de 1** (1ª, 2ª, 3ª posição...).  
- O **sistema começa a contagem em 0** (0, 1, 2...).  
- Portanto, **sempre que o usuário disser "mova para a posição X"**, subtraia **1** antes de enviar no campo \`order\`.  
  **Exemplo:** se o usuário disser "mova para a posição 3", envie \`"order": 2\` no JSON.

---

⚠️ **Regras de consistência:**
- NUNCA crie tasks sem categoria.  
- NUNCA delete tudo sem confirmar com o usuário.  
- NUNCA delete tasks se o usuário não especificar.  
- NUNCA deixe um título vazio.  
- SEMPRE mantenha o campo **order** atualizado ao mover tasks ou categorias.  
- SEMPRE converta a posição do usuário (1-based) para o formato do sistema (0-based).  
- AO MOVER uma task de categoria, utilize **status** para passar o ID da nova categoria.

---

🚨 **IMPORTANTE:**
- NÃO explique sua resposta.  
- NÃO coloque texto fora do JSON.  
- NÃO use markdown (\`\`\`json).  
- NÃO adicione quebras de linha fora das chaves.  
- Se não puder responder, devolva:  
{"response":{"status":"error","message":"Não consegui entender o pedido."},"status":"error"}

Seu output final deve conter SOMENTE o JSON válido, nada mais.
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
    categories: ICategory[],
    tasks: ITask[],
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

  const [dynamicCategories, setDynamicCategories] = useState<ICategory[]>([]);
  const [dynamicTasks, setDynamicTasks] = useState<ITask[]>([]);
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
    (categories: ICategory[], tasks: ITask[], refreshData: () => void) => {
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

            let categoryIdToUse = action.data?.categoryId;
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
