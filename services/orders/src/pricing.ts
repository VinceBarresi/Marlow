export function quote(subtotalCents: number) {
  const shippingCents = subtotalCents >= 7500 ? 0 : 800;
  const taxCents = Math.round(subtotalCents * 0.08);
  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
  };
}
