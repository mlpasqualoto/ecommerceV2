export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // cria data em UTC com a hora atual
  const now = new Date();
  
  // subtrai 3 horas para ajustar de UTC para Brasília (UTC-3)
  const date = new Date(Date.UTC(
    parseInt(ano),
    parseInt(mes) - 1,
    parseInt(dia),
    now.getUTCHours() - 3, // subtrai 3 horas
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  
  return date;
}
