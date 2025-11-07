import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Category from "@/models/Category";
import {
  AgentRequest,
  AgentResponse,
  AgentAction,
} from "@/app/interfaces/agents";
import { isUserPremium } from "@/lib/subscribtionUtils";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

const MAX_FREE_CATEGORIES = 4;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email || !session?.user?.plan) {
    return NextResponse.json(
      {
        response: {
          status: "error",
          message: "Não autorizado. Por favor, faça login novamente.",
        },
        status: "error",
      } as AgentResponse,
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    const { masterPrompt, context, userMessage, chatHistory }: AgentRequest =
      await request.json();
    const dbUser = await User.findById(session.user.id);
    if (!dbUser) {
      return NextResponse.json(
        {
          response: {
            status: "error",
            message: "Usuário não encontrado",
          },
          status: "error",
        } as AgentResponse,
        { status: 404 }
      );
    }

    const userIsPremium = isUserPremium(dbUser);

    let fullPrompt = masterPrompt;
    fullPrompt += `\n\nContexto do Usuário (Plano: ${
      context.userPlan
    }, Premium: ${userIsPremium ? "Sim" : "Não"}):`;
    fullPrompt += `\n- Nome: ${context.userName}`;
    fullPrompt += `\n- Email: ${context.userEmail}`;
    fullPrompt += `\n- Categorias (${
      context.categories.length
    } total, limite free: ${MAX_FREE_CATEGORIES}): ${context.categories
      .map((c) => `${c.title} (ID: ${c._id})`)
      .join(", ")}`;
    fullPrompt += `\n- Tarefas (${context.tasks.length} total): ${context.tasks
      .map((t) => `${t.title} (ID: ${t._id}, Categoria: ${t.status})`)
      .join(", ")}`;

    fullPrompt += `\n\nHistórico de Conversa (últimas ${chatHistory.length} mensagens):`;
    chatHistory.forEach((msg) => {
      fullPrompt += `\n${msg.type === "user" ? "Usuário" : "Agente"}: ${
        msg.text
      }`;
    });

    fullPrompt += `\n\nMensagem do Usuário: ${userMessage}`;
    fullPrompt += `\n\nSua Resposta (APENAS o JSON COMPLETO conforme as instruções):`;

    const generationConfig = {
      temperature: 0.7,
      topP: 1,
      topK: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    let finalAgentResponse: AgentResponse | null = null;
    let attempt = 0;

    while (attempt < MAX_RETRIES + 1) {
      console.log(`🟡 Tentativa de IA ${attempt + 1}/${MAX_RETRIES + 1}...`);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
        safetySettings,
      });

      let responseText = result.response.text();
      responseText = responseText.replace(/```json|```/g, "").trim();
      console.log("🟡 Resposta bruta da IA (limpa):", responseText);

      try {
        if (
          !responseText ||
          responseText.length < 2 ||
          !(responseText.startsWith("{") && responseText.endsWith("}"))
        ) {
          throw new Error(
            `Resposta da IA não é um JSON válido ou está vazia na tentativa ${
              attempt + 1
            }.`
          );
        }

        const parsedResponse = JSON.parse(responseText);

        if (
          !parsedResponse.response ||
          typeof parsedResponse.response.message === "string"
        ) {
          finalAgentResponse = parsedResponse as AgentResponse;
        } else if (
          parsedResponse.message &&
          typeof parsedResponse.message === "string"
        ) {
          finalAgentResponse = {
            response: {
              status: parsedResponse.status || "agent",
              message: parsedResponse.message,
            },
            actions: parsedResponse.actions, // Tenta manter actions se existirem
            status: parsedResponse.status || "success",
          };
        } else {
          throw new Error("Resposta da IA não contém estrutura JSON esperada.");
        }

        if (!finalAgentResponse.response.status)
          finalAgentResponse.response.status = "agent";
        if (!finalAgentResponse.status) finalAgentResponse.status = "success";

        break;
      } catch (jsonError) {
        console.error("Erro ao parsear/adaptar JSON da IA:", jsonError);
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
      attempt++;
    }

    if (!finalAgentResponse) {
      throw new Error(
        "Focuslist Agent falhou em gerar uma resposta válida após todas as tentativas."
      );
    }

    if (
      finalAgentResponse.actions &&
      finalAgentResponse.actions.some((a) => a.type === "createCategory")
    ) {
      const existingCategoriesCount = await Category.countDocuments({
        userId: session.user.id,
      });
      // Conta quantas novas categorias a IA quer criar
      const newCategoriesCount = finalAgentResponse.actions.filter(
        (a) => a.type === "createCategory"
      ).length;

      if (
        !userIsPremium &&
        existingCategoriesCount + newCategoriesCount > MAX_FREE_CATEGORIES
      ) {
        finalAgentResponse = {
          response: {
            status: "agent",
            message: `Seu plano gratuito permite no máximo ${MAX_FREE_CATEGORIES} categorias. Você já tem ${existingCategoriesCount} e tentou criar mais ${newCategoriesCount}. Por favor, faça upgrade para o plano premium.`,
          },
          actions: [{ type: "suggestUpgrade", data: {} }], // Substitui as ações por sugestão de upgrade
          status: "success",
        };
      }
    }

    return NextResponse.json(finalAgentResponse, { status: 200 });
  } catch (error) {
    console.error("Erro no chatbot agent global:", error);
    return NextResponse.json(
      {
        response: {
          status: "error",
          message:
            "Desculpe, tive um problema interno ao processar sua requisição. Por favor, tente novamente.",
        },
        status: "error",
      } as AgentResponse,
      { status: 500 }
    );
  }
}
