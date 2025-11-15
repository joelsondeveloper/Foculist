import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";
import User from "@/models/User";
import { isUserPremium } from "@/lib/subscribtionUtils";
import mongoose from "mongoose";

const MAX_FREE_CATEGORIES = 4;

export async function GET() {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    try {
        const categories = await Category.find({userId: session.user.id}).select('title color order automationRule').sort({order: 1});
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
        const { title, color, automationRule } = await request.json();
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

        const category = await Category.create({ title, color: color || '#888', automationRule: automationRule || null, userId: session.user.id, order: newOrder });
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
        const body = await request.json();
        const { id, title, color, order, automationRule } = body;

        if (!id) {
            return NextResponse.json({ sucess: false, message: 'ID é obrigatório' }, { status: 400 });
        }

        
        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json({ sucess: false, message: 'Categoria não encontrada ou não pertence ao usuário' }, { status: 404 });
        }
        await category?.updateOne({ title, color: color || '#888', order, automationRule: automationRule || null });
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ sucess: false, message: 'ID inválido' }, { status: 400 });
        }

        const categoryToDelete = await Category.findOne({ _id: id, userId: session.user.id });

        if (!categoryToDelete) {
            return NextResponse.json({ sucess: false, message: 'Categoria não encontrada ou não pertence ao usuário' }, { status: 404 });
        }

        await categoryToDelete?.deleteOne();
        return NextResponse.json({ sucess: true, data: { message: 'Categoria deletada com sucesso' } }, { status: 200 });
    } catch (error) {
        console.log("Erro ao deletar categoria:", error);
        return NextResponse.json({ sucess: false, message: 'Erro ao deletar categoria' }, { status: 500 });
    }
}