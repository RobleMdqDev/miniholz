import { prisma } from "@/lib/prisma";
import type { ShippingAddressInput } from "@/lib/validations/checkout";

/**
 * La dirección se guarda como snapshot JSON en `Order.shippingAddress`, no como
 * FK a `Address`: si el cliente edita o borra su dirección después, los pedidos
 * históricos tienen que seguir mostrando a dónde se enviaron.
 */
export type ShippingAddressSnapshot = ShippingAddressInput;

export function serializeShippingAddress(address: ShippingAddressSnapshot): string {
  return JSON.stringify(address);
}

export function parseShippingAddress(raw: string): ShippingAddressSnapshot | null {
  try {
    return JSON.parse(raw) as ShippingAddressSnapshot;
  } catch {
    return null;
  }
}

export function formatShippingAddress(address: ShippingAddressSnapshot): string {
  return [
    `${address.street} ${address.number}`,
    address.city,
    address.province,
    `CP ${address.postalCode}`,
  ].join(", ");
}

const orderDetailSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  guestEmail: true,
  guestName: true,
  guestPhone: true,
  shippingAddress: true,
  subtotal: true,
  shippingCost: true,
  total: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  transferReceiptUrl: true,
  notes: true,
  createdAt: true,
  user: { select: { name: true, email: true } },
  items: {
    select: {
      id: true,
      productName: true,
      variantName: true,
      personalizationText: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
      productVariant: {
        select: {
          product: {
            select: {
              slug: true,
              images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  },
} as const;

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, select: orderDetailSelect });
}

/**
 * Un pedido de invitado solo se protege por lo impredecible de su id (cuid):
 * quien tenga el link lo ve, que es lo que permite comprar sin crear cuenta.
 * Un pedido con dueño exige ser ese usuario (o un admin).
 */
export function canViewOrder(
  order: { userId: string | null },
  viewer: { id: string; role: string } | null,
): boolean {
  if (!order.userId) return true;
  if (!viewer) return false;
  return viewer.id === order.userId || viewer.role === "ADMIN";
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
      items: { select: { id: true, productName: true, quantity: true } },
    },
  });
}

export async function getStoreSettings() {
  return prisma.storeSettings.findUnique({ where: { id: 1 } });
}
