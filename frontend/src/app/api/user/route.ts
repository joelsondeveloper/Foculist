import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { use } from "react";

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();

    try {
        
        const userToDelete = await User.findById(session.user.id);

        if (!userToDelete) {
            return NextResponse.json({ sucess: false, message: 'Usuário não encontrado' }, { status: 404 });
        }

        await userToDelete?.deleteOne();

        console.log(`✅ Usuário ${session.user.id} e seus dados associados deletados com sucesso.`);

        return NextResponse.json({ sucess: true, data: { message: 'Usuário deletado com sucesso' } }, { status: 200 });

    } catch (error) {
        console.log("Erro ao deletar usuário:", error);
        return NextResponse.json({ sucess: false, message: 'Erro ao deletar usuário' }, { status: 500 });
    }
}