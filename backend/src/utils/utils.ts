export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // ✅ Cria data em UTC com a hora atual em UTC
  const now = new Date();
  
  // Cria a data no meio-dia (12h) para evitar problemas de timezone
  const date = new Date(Date.UTC(
    parseInt(ano),
    parseInt(mes) - 1,
    parseInt(dia),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  
  return date;
}
