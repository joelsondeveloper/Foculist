import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import PushSubscription from "@/models/PushSubscription";
import webpush from "web-push";
import { Badge } from "lucide-react";
import { data } from "framer-motion/client";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_SUBJECT}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  await dbConnect();

  try {
    const notificationPayload = {
      title: "Notificação de Teste do Focuslist!",
      body: "Sua inscrição de notificação está funcionando corretamente. 🎉",
      icon: "/icons/icon-192x192.png",
      url: `${process.env.NEXTAUTH_URL}/profile`,
      Badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        url: `${process.env.NEXTAUTH_URL}/profile`,
        customData: "Custom data",
      }
    };

    const subscriptions = await PushSubscription.find({
      userId: session.user.id,
    });
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { sucess: false, message: "Nenhuma inscrição encontrada" },
        { status: 404 }
      );
    }

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.toJSON(),
          JSON.stringify(notificationPayload)
        );
        console.log(
          `✅ Notificação de teste enviada para endpoint: ${sub.endpoint}`
        );
        return { status: "success", endpoint: sub.endpoint };
      } catch (error: any) {
        console.error(
          `🔴 Falha ao enviar notificação para endpoint ${sub.endpoint}:`,
          error
        );

        if (
          error.statusCode === 410 ||
          error.body?.includes("invalid subscription")
        ) {
          await PushSubscription.deleteOne({ _id: sub._id });
          console.warn(
            `🗑️ PushSubscription inválida removida: ${sub.endpoint}`
          );
          return {
            status: "deleted",
            endpoint: sub.endpoint,
            error: error.message,
          };
        }
        return {
          status: "failed",
          endpoint: sub.endpoint,
          error: error.message,
        };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const failedSends = results.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && result.value.status === "failed")
    );

    if (failedSends.length > 0) {
      return NextResponse.json(
        {
          sucess: false,
          message: `Notificação de teste falhou para ${failedSends.length} inscrições.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { sucess: true, message: "Notificação de teste enviada com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao enviar notificação de teste:", error);
    return NextResponse.json(
      { sucess: false, message: "Erro ao enviar notificação de teste" },
      { status: 500 }
    );
  }
}
