import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "invoice.payment_succeeded",
  "customer.subscription.deleted",
]);

export async function POST(req: NextRequest) {
  const buf = await buffer(req.body);
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      return NextResponse.json(
        { message: "No signature or webhook secret" },
        { status: 400 }
      );
    }
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch {
    return NextResponse.json(
      { message: "Erro ao construir evento" },
      { status: 400 }
    );
  }

  if (relevantEvents.has(event.type)) {
    try {
      await dbConnect();

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const mongoUserId =
          session.client_reference_id || session.metadata?.mongoUserId;
        if (!mongoUserId || !session.subscription) return;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        let subscriptionEnd: Date | null = null;
        if (subscription.current_period_end) {
          subscriptionEnd = new Date(subscription.current_period_end * 1000);
        } else {
          // Define 30 dias após a compra, caso o Stripe não envie
          subscriptionEnd = new Date();
          subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);
        }

        await User.findByIdAndUpdate(mongoUserId, {
          plan: "premium",
          subscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          subscriptionEndDate: subscriptionEnd,
        });

        console.log(
          `✅ Usuário ${mongoUserId} atualizado — plano premium, expiração: ${
            subscriptionEnd || "N/A"
          }`
        );
      }

      if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) {
          console.warn("⚠️ Nenhum subscriptionId encontrado na invoice");
          return NextResponse.json(
            { message: "Subscription ID ausente" },
            { status: 400 }
          );
        }

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;

        const updateData: any = { subscriptionId: subscription.id };
        if (currentPeriodEnd && !isNaN(currentPeriodEnd.getTime())) {
          updateData.subscriptionEndDate = currentPeriodEnd;
        }

        const updatedUser = await User.findOneAndUpdate(
          { subscriptionId: subscription.id },
          updateData,
          { new: true }
        );

        if (updatedUser) {
          console.log(
            `✅ Assinatura atualizada com sucesso — userId: ${
              updatedUser._id
            }, expira em: ${updateData.subscriptionEndDate || "N/A"}`
          );
        } else {
          console.error(
            `❌ Nenhum usuário encontrado com subscriptionId ${subscription.id}`
          );
        }
      }
    } catch (error) {
      console.error("ERRO NO PROCESSAMENTO DO WEBHOOK:", error);
      return NextResponse.json(
        { error: "Webhook handler failed." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
