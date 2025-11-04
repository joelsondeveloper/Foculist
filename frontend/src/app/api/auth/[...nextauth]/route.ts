import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import Category from "@/models/Category";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials?: { email?: string; password?: string } | undefined
      ) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }
        await dbConnect();
        const user = await User.findOne({ email: credentials?.email }).select(
          "+password"
        );
        if (!user) {
          throw new Error("Usuário não encontrado");
        }
        if (!user.emailVerified) {
          throw new Error(
            "Por favor, verifique seu e-mail antes de fazer o login."
          );
        }
        const isPasswordValid = await bcrypt.compare(
          credentials?.password as string,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error("Senha inválida");
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        try {
          const defaultCategories = [
            { title: "Atrasado", color: "#EF4444", userId: user.id },
            { title: "Hoje", color: "#3B82F6", userId: user.id },
            { title: "Em andamento", color: "#F97316", userId: user.id },
            { title: "Concluído", color: "#22C55E", userId: user.id },
          ];
          await Category.insertMany(defaultCategories);
        } catch (error) {
          console.log("Erro ao criar categorias padrão:", error);
        }
      }
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
