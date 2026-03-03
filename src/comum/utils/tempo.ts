export function inicioEFimDoDia(dataIso: string): { inicio: Date; fim: Date } {
  const inicio = new Date(`${dataIso}T00:00:00.000Z`);
  const fim = new Date(`${dataIso}T23:59:59.999Z`);
  return { inicio, fim };
}
