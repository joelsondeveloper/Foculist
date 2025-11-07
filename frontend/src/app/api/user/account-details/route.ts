import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import User, { IUser } from "@/models/User";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    try {
        const user = await User.findById(session.user.id).select('+password plan subscriptionEndDate').lean() as { password?: string, plan?: string, subscriptionEndDate?: Date } | null;
        if (!user) {
            return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
        }
        const hasPassword = !!user.password;
        let currentPlan = user.plan || 'free';
        let isPremium = false
        if (currentPlan === 'premium' && user.subscriptionEndDate && new Date() < new Date(user.subscriptionEndDate)) {
            isPremium = true
        } else {
            currentPlan = 'free'
        }
        return NextResponse.json({ success: true, data: {
            provider: hasPassword ? 'credentials' : 'oauth',
            plan: currentPlan,
            subscriptionEndDate: user.subscriptionEndDate,
            isPremium
        } });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Erro ao buscar usuário' }, { status: 500 });
    }
}