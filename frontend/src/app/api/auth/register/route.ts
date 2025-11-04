import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import sgMail from "@sendgrid/mail";
import crypto from "crypto";
import VerificationToken from "@/models/VerificationToken";
import Category from "@/models/Category";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { sucess: false, message: "Preencha todos os campos" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { sucess: false, message: "Usuário já cadastrado" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    const defaultCategories = [
      { title: "Atrasado", color: "#EF4444", userId: user._id },
      { title: "Hoje", color: "#3B82F6", userId: user._id },
      { title: "Em andamento", color: "#F97316", userId: user._id },
      { title: "Concluído", color: "#22C55E", userId: user._id },
    ];

    console.log("🟡 Criando categorias padrão para:", user._id);
    await Category.insertMany(defaultCategories);
    console.log("🟢 Categorias criadas!");

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await VerificationToken.create({
      identifier: email,
      token: verificationToken,
      expires: tokenExpiresAt,
    });

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;

    const msg = {
      to: email,
      from: "vicentejoelson80@gmail.com",
      subject: "Verifique seu e-mail - Focuslist",
      html: `<p>Clique <a href="${verificationUrl}">aqui</a> para verificar seu e-mail e ativar sua conta.</p>`,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error("Erro ao enviar o e-mail de verificação:", error);
    }

    return NextResponse.json(
      { sucess: true, data: { name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ sucess: false, error }, { status: 400 });
  }
}
