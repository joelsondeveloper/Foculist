import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import PushSubscription from "@/models/PushSubscription";
import webpush from "web-push";

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
    const subscriptionData = await req.json();

    const existingSubscription = await PushSubscription.findOne({
      userId: session.user.id,
      endpoint: subscriptionData.endpoint,
    });

    if (existingSubscription) {
      existingSubscription.keys = subscriptionData.keys;
      await existingSubscription.save();
      console.log(
        `🟡 PushSubscription existente atualizada para user ${session.user.id}`
      );
      return NextResponse.json(
        { sucess: true, message: "Inscrição atualizada" },
        { status: 200 }
      );
    } else {
      const newSubscription = await PushSubscription.create({
        userId: session.user.id,
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
      });
      console.log(`🟢 PushSubscription criada para user ${session.user.id}`);
      return NextResponse.json(
        { sucess: true, message: "Inscrição criada" },
        { status: 201 }
      );
    }
  } catch (error) {
    console.log("Erro ao criar PushSubscription:", error);
    return NextResponse.json(
      { sucess: false, message: "Erro ao criar PushSubscription" },
      { status: 500 }
    );
  }
}
