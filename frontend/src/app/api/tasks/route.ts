import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Task from "@/models/Task";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";

export async function GET() {


    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({message: "Não autorizado"}, {status: 401});
    }

    await dbConnect();
    
    try {
        
        const tasks = await Task.find({userId: session.user.id});
        return NextResponse.json({sucess: true, data: tasks});

    } catch (error) {
        
        return NextResponse.json({sucess: false, error: error}, {status: 400});

    }
}

export async function POST(request: Request) {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({message: "Não autorizado"}, {status: 401});
    }

    await dbConnect();

    try {
        const body = await request.json();
        const {title, description, status, dueDate, priority} = body;

        console.log(body);

        if (!title || !description || !status) {
            return NextResponse.json({sucess: false, message: "Título, descrição e status (ID da categoria) sao obrigatorios"}, {status: 400});
        }
        const task = await Task.create({
            title,
            description,
            status,
            dueDate: dueDate || null,
            priority: priority || "medium",
            userId: session.user.id
        });
        return NextResponse.json({sucess: true, data: task}, {status: 201});
    } catch (error) {
        console.log("Erro ao criar tarefa:", error);
        return NextResponse.json({sucess: false, error: error}, {status: 400});
    }
}

export async function PUT(request: NextRequest) {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({message: "Não autorizado"}, {status: 401});
    }

    await dbConnect();

    try {
        const {id, title, description, status, dueDate, priority, isCompleted} = await request.json();
        if (!id) {
            return NextResponse.json({sucess: false, message: "ID e obrigatorio"}, {status: 400});
        }

         const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;
        if (dueDate !== undefined) updates.dueDate = dueDate;
        if (priority !== undefined) updates.priority = priority;
        if (isCompleted !== undefined) updates.isCompleted = isCompleted;

        const task = await Task.findOneAndUpdate({_id: id, userId: session.user.id}, updates, {new: true});
        if (!task) {
            return NextResponse.json({sucess: false, message: "Tarefa nao encontrada ou nao pertence ao usuario"}, {status: 404});
        }
        return NextResponse.json({sucess: true, data: task}, {status: 200});
    } catch (error) {
        console.log("Erro ao atualizar tarefa:", error);
        return NextResponse.json({sucess: false, error: error}, {status: 500});
    }
}

export async function DELETE(request: NextRequest) {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({message: "Não autorizado"}, {status: 401});
    }

    await dbConnect();

    try {
        const id = request.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({sucess: false, message: "ID e obrigatorio"}, {status: 400});
        }
        const task = await Task.deleteOne({_id: id, userId: session.user.id});
        if (task.deletedCount === 0) {
            return NextResponse.json({sucess: false, message: "Tarefa nao encontrada ou nao pertence ao usuario"}, {status: 404});
        }
        return NextResponse.json({sucess: true, data: task}, {status: 200});
    } catch (error) {
        console.log("Erro ao deletar tarefa:", error);
        return NextResponse.json({sucess: false, error: error}, {status: 500});
    }
}