import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { id: userId, email, name } = session.user;
  const priceId = process.env.STRIPE_PREMIUM_PLAN_PRICE_ID!;

  await dbConnect();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          mongoUserId: userId,
        },
      });
      stripeCustomerId = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId,
      success_url: `${process.env.NEXTAUTH_URL}/profile?payment_status=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/profile?payment_status=canceled`,
      client_reference_id: userId,
      metadata: {
        mongoUserId: userId,
      },
      expand: ['subscription'],
    });

    if (stripeSession.url) {
      return NextResponse.json({ url: stripeSession.url });
    } else {
      return NextResponse.json(
        { message: "Erro ao criar sessão de pagamento" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log("Erro ao criar sessão de pagamento:", error);
    return NextResponse.json(
      { message: "Erro ao criar sessão de pagamento" },
      { status: 500 }
    );
  }
}
