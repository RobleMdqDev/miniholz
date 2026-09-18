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

type RawOrderEvent = {
  id: string;
  type: OrderEventType;
  actor: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  fromPaymentStatus: PaymentStatus | null;
  toPaymentStatus: PaymentStatus | null;
  mpPaymentId: string | null;
  detail: string | null;
  createdAt: Date;
};

/**
 * `OrderEvent` guarda el id del administrador y no su nombre a propósito, para
 * que renombrar a alguien no reescriba la historia ya asentada. Se resuelve al
 * leer, en una sola consulta para todo el lote.
 */
async function resolveAdminNames(events: RawOrderEvent[]): Promise<Map<string, string>> {
  const ids = [
    ...new Set(
      events
        .map((event) => event.actor)
        .filter((actor) => actor.startsWith("admin:"))
        .map((actor) => actor.slice("admin:".length)),
    ),
  ];
  if (ids.length === 0) return new Map();

  const admins = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return new Map(admins.map((admin) => [admin.id, admin.name]));
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

function toTimelineEntry(event: RawOrderEvent, adminNameById: Map<string, string>): OrderTimelineEntry {
  return {
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
  };
}

/** Bitácora de un pedido, para `/admin/pedidos/[id]`. */
export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEntry[]> {
  const events = await prisma.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
  const adminNameById = await resolveAdminNames(events);
  return events.map((event) => toTimelineEntry(event, adminNameById));
}

export const ORDER_EVENT_TYPES = [
  "CREATED",
  "PAYMENT_SYNCED",
  "STATUS_CHANGED",
  "CANCELLED_WITH_RESTOCK",
  "SHIPPING_COST_SET",
] as const satisfies readonly OrderEventType[];

/**
 * Origen del cambio, para filtrar sin que la vista tenga que conocer el formato
 * interno de `actor` (`admin:<id>`, `webhook`, `return`, `system`).
 */
export const AUDIT_SOURCES = ["mercadopago", "admin", "tienda"] as const;
export type AuditSource = (typeof AUDIT_SOURCES)[number];

export const AUDIT_PAGE_SIZE = 50;

export type AuditLogEntry = OrderTimelineEntry & { orderId: string; orderNumber: number };

function actorFilter(source: AuditSource) {
  if (source === "mercadopago") return { in: ["webhook", "return"] };
  if (source === "admin") return { startsWith: "admin:" };
  return { equals: "system" };
}

/**
 * Bitácora completa, para `/admin/auditoria`. Va paginada porque esta tabla
 * crece con cada cambio de cada pedido y no tiene techo, a diferencia del
 * listado de pedidos.
 */
export async function getAuditLog(filters: { type?: string; source?: string; page?: string }) {
  const type = (ORDER_EVENT_TYPES as readonly string[]).includes(filters.type ?? "")
    ? (filters.type as OrderEventType)
    : undefined;
  const source = (AUDIT_SOURCES as readonly string[]).includes(filters.source ?? "")
    ? (filters.source as AuditSource)
    : undefined;
  const where = {
    ...(type ? { type } : {}),
    ...(source ? { actor: actorFilter(source) } : {}),
  };

  // El total se pide primero para poder acotar la página: con un `?page=` a
  // mano, saltear más allá del final dejaba una lista vacía sin forma de
  // volver. Son dos consultas en vez de una, cosa que en el panel no se nota.
  const total = await prisma.orderEvent.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.trunc(Number(filters.page)) || 1));

  const events = await prisma.orderEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * AUDIT_PAGE_SIZE,
    take: AUDIT_PAGE_SIZE,
    include: { order: { select: { id: true, orderNumber: true } } },
  });

  const adminNameById = await resolveAdminNames(events);

  return {
    total,
    page,
    pageCount,
    entries: events.map((event) => ({
      ...toTimelineEntry(event, adminNameById),
      orderId: event.orderId,
      orderNumber: event.order.orderNumber,
    })) satisfies AuditLogEntry[],
  };
}
