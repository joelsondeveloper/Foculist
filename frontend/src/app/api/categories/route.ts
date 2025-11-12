import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";
import User from "@/models/User";
import { isUserPremium } from "@/lib/subscribtionUtils";

const MAX_FREE_CATEGORIES = 4;

export async function GET() {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    try {
        const categories = await Category.find({userId: session.user.id}).sort({order: 1});
        return NextResponse.json({ sucess: true, data: categories });
    } catch (error) {
        return NextResponse.json({ sucess: false, message: 'Erro ao buscar categorias' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    try {
        const { title, color } = await request.json();
        if (!title) {
            return NextResponse.json({ sucess: false, message: 'Título é obrigatório' }, { status: 400 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ sucess: false, message: 'Usuário não encontrado' }, { status: 404 });
        }

        if (!isUserPremium(user)) {
            const existingCategoriesCount = await Category.countDocuments({ userId: session.user.id });
            if (existingCategoriesCount >= MAX_FREE_CATEGORIES) {
                return NextResponse.json({ sucess: false, message: `Limite de ${MAX_FREE_CATEGORIES} colunas atingido para o plano gratuito. Faça upgrade para criar mais.` }, { status: 403 });
            }
        }

        const userCategoriesCount = await Category.countDocuments({ userId: session.user.id });
        const newOrder = userCategoriesCount;

        const category = await Category.create({ title, color: color || '#888', userId: session.user.id, order: newOrder });
        return NextResponse.json({ sucess: true, data: category }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ sucess: false, message: 'Erro ao criar categoria' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest  ) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    try {
        const { id, title, color, order } = await request.json();

        if (!id) {
            return NextResponse.json({ sucess: false, message: 'ID e título são obrigatórios' }, { status: 400 });
        }

        

        const category = await Category.findOneAndUpdate({ _id: id, userId: session.user.id }, { title, color, order }, { new: true });
        if (!category) {
            return NextResponse.json({ sucess: false, message: 'Categoria não encontrada ou não pertence ao usuário' }, { status: 404 });
        }
        return NextResponse.json({ sucess: true, data: category }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ sucess: false, message: 'Erro ao atualizar categoria' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    try {
        const id = request.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ sucess: false, message: 'ID é obrigatório' }, { status: 400 });
        }
        const category = await Category.deleteOne({ _id: id, userId: session.user.id });
        if (category.deletedCount === 0) {
            return NextResponse.json({ sucess: false, message: 'Categoria não encontrada ou não pertence ao usuário' }, { status: 404 });
        }
        return NextResponse.json({ sucess: true, data: category }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ sucess: false, message: 'Erro ao deletar categoria' }, { status: 500 });
    }
}