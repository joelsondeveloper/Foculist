import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import Category from "@/models/Category";
import mongoose from "mongoose";
import { getDefaultCategories } from "./getDefaultCategories";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );
        if (!user) throw new Error("Usuário não encontrado");

        if (!user.emailVerified) {
          throw new Error(
            "Por favor, verifique seu e-mail antes de fazer login."
          );
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) throw new Error("Senha inválida");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          plan: user.plan,
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
          console.error("Erro ao criar categorias padrão:", error);
        }
      }
    },
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      await dbConnect();

      const existingUser = await User.findOne({ email: user.email });

      if (existingUser) {
        if (account?.provider === "google") {
          const db = mongoose.connection.db;
          if (!db) throw new Error("Banco de dados não conectado");

          const accountsCollection = db.collection("accounts");

          const accountExists = await accountsCollection.findOne({
            userId: existingUser._id,
            provider: "google",
          });

          if (!accountExists) {
            await accountsCollection.insertOne({
              userId: existingUser._id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
            });
          }
        }

        if (!existingUser.plan) {
          existingUser.plan = "free";
          await existingUser.save();
        }
      } else {
        const newUser = await User.create({
          name: user.name,
          email: user.email,
          image: user.image || "",
          plan: "free",
          stripeCustomerId: "",
          subscriptionId: "",
          subscriptionEndDate: null,
        });
        if (account?.provider === "google") {
          const db = mongoose.connection.db;
          if (!db) throw new Error("Banco de dados não conectado");

          await db.collection("accounts").insertOne({
            userId: newUser._id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            token_type: account.token_type,
            scope: account.scope,
          });
        }

        await Category.insertMany(getDefaultCategories(newUser._id));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;

        await dbConnect();
        const userFromDb = await User.findById(token.id)
          .select("plan")
          .lean<{ plan?: string }>();

        if (userFromDb) {
          session.user.plan = userFromDb.plan || "free";
        }
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};