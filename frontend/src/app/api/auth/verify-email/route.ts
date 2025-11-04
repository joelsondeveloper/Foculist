import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";

export async function GET(request: NextRequest) {
    await dbConnect();

    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json({ message: "Token não encontrado" }, { status: 400 });
    }

    const storedToken = await VerificationToken.findOne({ token });

    if (!storedToken) {
        return NextResponse.json({ message: "Token inválido" }, { status: 400 });
    }

    if (new Date() > storedToken.expires) {
        return NextResponse.json({ message: "Token expirado" }, { status: 400 });
    }

    const user = await User.findOne({ email: storedToken.identifier });

    if (!user) {
        return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    user.emailVerified = new Date();
    await user.save();
    await VerificationToken.findByIdAndDelete(storedToken._id);

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?verified=true`);
}