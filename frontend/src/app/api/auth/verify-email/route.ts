import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "Token não encontrado" }, { status: 400 });
  }

  try {
    await dbConnect();
    const storedToken = await VerificationToken.findOne({ token });
    if (!storedToken || new Date() > storedToken.expires) {
      return NextResponse.json({ message: "Token inválido ou expirado" }, { status: 400 });
    }

    const user = await User.findOne({ email: storedToken.identifier });
    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    user.emailVerified = new Date();
    await user.save();
    await VerificationToken.findByIdAndDelete(storedToken._id);

    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } catch (error) {
    console.error("Erro ao verificar e-mail:", error);
    return NextResponse.json(
      { message: "Não foi possível verificar o e-mail no momento" },
      { status: 503 }
    );
  }
}
