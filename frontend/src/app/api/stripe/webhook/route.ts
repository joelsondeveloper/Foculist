import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import dbConnect from "@/lib/dbConnect";
import User, { IUser } from "@/models/User";

async function buffer(readable: ReadableStream<Uint8Array> | null) {
  if (!readable) return Buffer.alloc(0);

  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.deleted",
  "customer.subscription.updated",
]);

export async function POST(req: NextRequest) {
  const buf = await buffer(req.body);
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      return NextResponse.json(
        { message: "Webhook secret or signature missing." },
        { status: 400 }
      );
    }
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  if (relevantEvents.has(event.type)) {
    try {
      await dbConnect();

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const mongoUserId = session.client_reference_id;
        const subscriptionId = session.subscription as string;
        const stripeCustomerId = session.customer as string;

        if (!mongoUserId || !subscriptionId || !stripeCustomerId) {
          console.error(
            "ERRO: Faltando dados essenciais na sessão de checkout."
          );
          return NextResponse.json(
            { error: "Dados da sessão de checkout incompletos." },
            { status: 400 }
          );
        }

        // --- LÓGICA MANUAL E DIRETA PARA A DATA DE EXPIRAÇÃO ---
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // Adiciona 30 dias a partir de agora

        const updateData: Partial<IUser> = {
          plan: "premium",
          subscriptionId: subscriptionId,
          stripeCustomerId: stripeCustomerId,
          subscriptionEndDate: subscriptionEndDate,
        };

        await User.findByIdAndUpdate(mongoUserId, updateData);

        console.log(
          `✅ Usuário ${mongoUserId} atualizado para Premium. Expiração definida manualmente para: ${subscriptionEndDate}`
        );
      }

      if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        // Ignora faturas que não são de uma assinatura (ex: pagamento único)
        if (!subscriptionId) {
          return NextResponse.json({ received: true });
        }

        // Lógica de data manual/fallback para a renovação
        const newSubscriptionEndDate = new Date();
        newSubscriptionEndDate.setDate(newSubscriptionEndDate.getDate() + 30);

        await User.findOneAndUpdate(
          { subscriptionId: subscriptionId },
          { subscriptionEndDate: newSubscriptionEndDate }
        );

        console.log(
          `✅ Assinatura ${subscriptionId} renovada. Nova expiração definida para: ${newSubscriptionEndDate}`
        );
      }
    } catch (error) {
      console.error("ERRO NO PROCESSAMENTO DO WEBHOOK:", error);
      return NextResponse.json(
        { error: "Webhook handler failed." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
