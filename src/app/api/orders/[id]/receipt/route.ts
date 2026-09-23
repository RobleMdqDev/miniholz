import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewOrder } from "@/lib/orders";
import { maxUploadBytes, RECEIPT_ALLOWED_TYPES, storage } from "@/lib/storage";
import { sendAdminReceiptUploaded } from "@/lib/email/orders";

/** Subida del comprobante de transferencia. Va por API route y no por Server
 * Action porque recibe un archivo y necesita responder con la url resultante. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/orders/[id]/receipt">) {
  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      userId: true,
      paymentMethod: true,
      transferReceiptUrl: true,
    },
  });
  if (!order) {
    return Response.json({ error: "El pedido no existe." }, { status: 404 });
  }

  const session = await auth();
  if (!canViewOrder(order, session?.user ?? null)) {
    return Response.json({ error: "No tenés acceso a este pedido." }, { status: 403 });
  }

  if (order.paymentMethod !== "TRANSFER") {
    return Response.json(
      { error: "Este pedido no se paga por transferencia." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Adjuntá el comprobante." }, { status: 400 });
  }

  if (!RECEIPT_ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "El comprobante tiene que ser una imagen (JPG, PNG o WEBP) o un PDF." },
      { status: 400 },
    );
  }

  const maxBytes = maxUploadBytes();
  if (file.size > maxBytes) {
    return Response.json(
      { error: `El archivo supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB.` },
      { status: 400 },
    );
  }

  const saved = await storage.save(file, `uploads/receipts/${order.id}`);

  // Si ya había subido otro comprobante, el anterior queda huérfano en disco.
  if (order.transferReceiptUrl) {
    await storage.delete(order.transferReceiptUrl);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { transferReceiptUrl: saved.url },
  });

  // Sin este aviso, un comprobante puede quedar días sin que nadie lo mire: no
  // hay nada en el panel que se encienda solo. No se espera el envío ni se
  // deja que falle la subida por su culpa.
  void sendAdminReceiptUploaded({
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    receiptUrl: saved.url,
  }).catch((cause) => console.error("[email] falló el aviso de comprobante", cause));

  return Response.json({ url: saved.url });
}
