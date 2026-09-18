import { z } from "zod";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
  personalizationText: z.string().max(40).default(""),
});

export const cartItemsSchema = z.array(cartItemSchema).max(50);
