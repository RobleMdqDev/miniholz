const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

/** Formatea un monto guardado en centavos (entero) como moneda ARS. */
export function formatCurrencyFromCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}
