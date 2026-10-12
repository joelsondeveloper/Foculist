import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import Category from "@/models/Category";
import { getDefaultCategories } from "@/lib/getDefaultCategories";
import {
  isVerificationEmailConfigured,
  sendVerificationEmail,
} from "@/lib/sendVerificationEmail";

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Dados inválidos" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: "Dados inválidos" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    return NextResponse.json(
      { success: false, message: "Preencha todos os campos" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, message: "E-mail inválido" },
      { status: 400 }
    );
  }

  if (!isVerificationEmailConfigured()) {
    console.error("Cadastro indisponível: SENDGRID_API_KEY não configurada");
    return NextResponse.json(
      { success: false, message: "Cadastro indisponível no momento. Tente novamente mais tarde." },
      { status: 503 }
    );
  }

  try {
    await dbConnect();

    const existingUser = await User.findOne({ email }).select("+password");
    if (existingUser) {
      if (existingUser.emailVerified || !existingUser.password ||
          !(await bcrypt.compare(password, existingUser.password))) {
        return NextResponse.json(
          { success: false, message: "Usuário já cadastrado" },
          { status: 409 }
        );
      }

      // A previous delivery may have failed. Allow the same person to retry.
      if (!(await Category.exists({ userId: existingUser._id }))) {
        await Category.insertMany(getDefaultCategories(String(existingUser._id)));
      }
      await sendVerificationEmail(email, request.url);
      return NextResponse.json({ success: true, resent: true }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    await Category.insertMany(getDefaultCategories(String(user._id)));

    // Report delivery failures: an unverified account cannot sign in.
    // The user can resubmit the form with the same password to retry.
    await sendVerificationEmail(email, request.url);

    return NextResponse.json(
      { success: true, data: { name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar usuário ou enviar verificação:", error);
    return NextResponse.json(
      { success: false, message: "Não foi possível concluir o cadastro. Tente novamente." },
      { status: 503 }
    );
  }
}
