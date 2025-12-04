export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // cria data UTC e depois converte pra Brasília
  const date = new Date(Date.UTC(
    parseInt(ano),
    parseInt(mes) - 1, // mês começa em 0
    parseInt(dia),
    new Date().getUTCHours(),
    new Date().getUTCMinutes(),
    new Date().getUTCSeconds()
  ));
  
  // Ajusta de UTC para UTC-3 (Brasília)
  date.setUTCHours(date.getUTCHours() - 3);
  
  return date;
}
