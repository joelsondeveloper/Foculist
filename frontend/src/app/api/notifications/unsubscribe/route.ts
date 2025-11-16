import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import PushSubscription from "@/models/PushSubscription";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  await dbConnect();

  try {
    const { endpoint } = await req.json();

    const deletedSubscription = await PushSubscription.findOneAndDelete({
      userId: session.user.id,
      endpoint,
    });

    if (!deletedSubscription) {
      console.warn(
        `🟡 PushSubscription para user ${session.user.id} e endpoint ${endpoint} não encontrada para desinscrição.`
      );
      return NextResponse.json(
        { sucess: false, message: "Inscrição não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { sucess: true, message: "Inscrição deletada" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar PushSubscription:", error);
    return NextResponse.json(
      { sucess: false, message: "Erro ao deletar PushSubscription" },
      { status: 500 }
    );
  }
}
