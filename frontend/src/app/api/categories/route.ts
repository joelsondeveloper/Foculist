import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";
import { ObjectId } from "mongodb";


export async function GET() {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    await dbConnect();
    try {
        const categories = await Category.find({userId: session.user.id});
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
        const category = await Category.create({ title, color: color || '#888', userId: session.user.id });
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
        const { id, title, color } = await request.json();

        if (!id || !title) {
            return NextResponse.json({ sucess: false, message: 'ID e título são obrigatórios' }, { status: 400 });
        }

        

        const category = await Category.findOneAndUpdate({ _id: id, userId: session.user.id }, { title, color }, { new: true });
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