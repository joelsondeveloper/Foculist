import { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import Category from "@/models/Category";
import { getDefaultCategories } from "./getDefaultCategories";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Only verified Google emails are accepted in signIn below.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();
        const user = await User.findOne({
          email: credentials.email.trim().toLowerCase(),
        }).select("+password");
        if (!user?.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) return null;

        if (!user.emailVerified) {
          throw new Error("Por favor, verifique seu e-mail antes de fazer login.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          plan: user.plan || "free",
        };
      },
    }),
  ],

  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        await dbConnect();
        // NextAuth also emits createUser when linking a verified Google email
        // to an existing user. Do not duplicate that user's categories.
        if (!(await Category.exists({ userId: user.id }))) {
          await Category.insertMany(getDefaultCategories(user.id));
        }
      } catch (error) {
        console.error("Erro ao criar categorias padrão:", error);
      }
    },
    async linkAccount({ user, account }) {
      if (account.provider !== "google") return;
      try {
        await dbConnect();
        await User.updateOne(
          { _id: user.id, emailVerified: null },
          { $set: { emailVerified: new Date() } }
        );
      } catch (error) {
        console.error("Erro ao confirmar e-mail do Google:", error);
      }
    },
  },

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ account, profile }) {
      // The adapter owns OAuth user creation and account linking. Writing those
      // records here caused duplicate users/accounts and invalid sessions.
      const googleProfile = profile as (typeof profile & { email_verified?: boolean }) | undefined;
      return account?.provider !== "google" || googleProfile?.email_verified === true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      } else if (!token.id && token.sub) {
        token.id = token.sub;
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
        session.user.plan = userFromDb?.plan === "premium" ? "premium" : "free";
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};
