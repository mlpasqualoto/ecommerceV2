export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // cria string ISO com timezone explícito de Brasília (-03:00)
  const now = new Date();
  const horaFormatada = now.getHours().toString().padStart(2, '0');
  const minutoFormatado = now.getMinutes().toString().padStart(2, '0');
  const segundoFormatado = now.getSeconds().toString().padStart(2, '0');
  
  // Formato: "2025-12-03T22:00:00-03:00"
  const isoString = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horaFormatada}:${minutoFormatado}:${segundoFormatado}-03:00`;
  
  const date = new Date(isoString);
  
  return date;
}
