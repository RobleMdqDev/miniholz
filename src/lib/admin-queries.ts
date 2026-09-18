import { prisma } from "@/lib/prisma";
import type {
  OrderEventType,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/enums";

const LOW_STOCK_THRESHOLD = 3;

/** Contador del sidebar: transferencias esperando que el admin confirme el pago. */
export async function getPendingTransferCount(): Promise<number> {
  return prisma.order.count({
    where: { status: "PENDING_PAYMENT", paymentMethod: "TRANSFER" },
  });
}

export async function getAdminDashboard() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pendingTransfers, ordersThisMonth, paidThisMonth, lowStock, inactiveProducts] =
    await Promise.all([
      getPendingTransferCount(),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD }, product: { isActive: true } },
        orderBy: { stock: "asc" },
        take: 10,
        select: {
          id: true,
          name: true,
          stock: true,
          product: { select: { id: true, name: true, variants: { select: { id: true } } } },
        },
      }),
      prisma.product.count({ where: { isActive: false } }),
    ]);

  return {
    pendingTransfers,
    ordersThisMonth,
    revenueThisMonth: paidThisMonth._sum.total ?? 0,
    paidOrdersThisMonth: paidThisMonth._count,
    lowStock,
    inactiveProducts,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}

export async function getAdminProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      isActive: true,
      category: { select: { name: true } },
      images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
      variants: { select: { stock: true } },
    },
  });

  return products.map((product) => ({
    ...product,
    totalStock: product.variants.reduce((total, variant) => total + variant.stock, 0),
    variantCount: product.variants.length,
  }));
}

export async function getAdminProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      basePrice: true,
      compareAtPrice: true,
      isActive: true,
      categoryId: true,
      personalizationLabel: true,
      personalizationMaxLength: true,
      personalizationRequired: true,
      images: { select: { id: true, url: true, alt: true, position: true }, orderBy: { position: "asc" } },
      variants: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          sku: true,
          priceOverride: true,
          stock: true,
          _count: { select: { orderItems: true } },
        },
      },
    },
  });
}

export async function getAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      position: true,
      _count: { select: { products: true } },
    },
  });
}

export type AdminOrderFilters = {
  status?: string;
  paymentMethod?: string;
};

export async function getAdminOrders(filters: AdminOrderFilters) {
  const status = isOrderStatus(filters.status) ? filters.status : undefined;
  const paymentMethod = isPaymentMethod(filters.paymentMethod) ? filters.paymentMethod : undefined;

  return prisma.order.findMany({
    where: { ...(status ? { status } : {}), ...(paymentMethod ? { paymentMethod } : {}) },
    orderBy: { orderNumber: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      total: true,
      status: true,
      paymentMethod: true,
      transferReceiptUrl: true,
      guestName: true,
      user: { select: { name: true, email: true } },
      items: { select: { id: true } },
    },
  });
}

const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_METHODS = ["MERCADOPAGO", "TRANSFER", "WHATSAPP"] as const;

function isOrderStatus(value: unknown): value is (typeof ORDER_STATUSES)[number] {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

function isPaymentMethod(value: unknown): value is (typeof PAYMENT_METHODS)[number] {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export { ORDER_STATUSES, PAYMENT_METHODS };

export type OrderTimelineEntry = {
  id: string;
  type: OrderEventType;
  at: Date;
  actorLabel: string;
  statusChange: { from: OrderStatus | null; to: OrderStatus } | null;
  paymentChange: { from: PaymentStatus | null; to: PaymentStatus } | null;
  mpPaymentId: string | null;
  detail: string | null;
};

/**
 * Bitácora de un pedido para `/admin/pedidos/[id]`.
 *
 * Los administradores se resuelven en una sola consulta aparte: `OrderEvent`
 * guarda el id y no el nombre a propósito, para que renombrar a alguien no
 * reescriba la historia ya asentada.
 */
export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEntry[]> {
  const events = await prisma.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });

  const adminIds = [
    ...new Set(
      events
        .map((event) => event.actor)
        .filter((actor) => actor.startsWith("admin:"))
        .map((actor) => actor.slice("admin:".length)),
    ),
  ];
  const admins = adminIds.length
    ? await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true } })
    : [];
  const adminNameById = new Map(admins.map((admin) => [admin.id, admin.name]));

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    at: event.createdAt,
    actorLabel: describeActor(event.actor, adminNameById),
    statusChange: event.toStatus ? { from: event.fromStatus, to: event.toStatus } : null,
    paymentChange: event.toPaymentStatus
      ? { from: event.fromPaymentStatus, to: event.toPaymentStatus }
      : null,
    mpPaymentId: event.mpPaymentId,
    detail: event.detail,
  }));
}

function describeActor(actor: string, adminNameById: Map<string, string>): string {
  if (actor === "webhook") return "Mercado Pago (aviso automático)";
  if (actor === "return") return "Mercado Pago (vuelta del checkout)";
  if (actor === "system") return "Tienda";
  if (actor.startsWith("admin:")) {
    // Un admin borrado deja el id huérfano; se muestra igual, porque perder el
    // asiento sería peor que mostrarlo sin nombre.
    return adminNameById.get(actor.slice("admin:".length)) ?? "Administrador (cuenta eliminada)";
  }
  return actor;
}
