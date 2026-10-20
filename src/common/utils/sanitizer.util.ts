export function maskTaxId(taxId?: string | null): string {
  if (!taxId || typeof taxId !== 'string') {
    return '';
  }
  return `***-**-${taxId.slice(-4)}`;
}
