export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // ✅ Cria data em UTC e subtrai 3 horas para ficar em horário de Brasília
  const now = new Date();
  const date = new Date(Date.UTC(
    parseInt(ano),
    parseInt(mes) - 1,
    parseInt(dia),
    now.getHours() + 3, // Compensa UTC-3 adicionando 3h
    now.getMinutes(),
    now.getSeconds()
  ));
  
  return date;
}
