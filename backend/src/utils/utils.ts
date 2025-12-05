export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // ✅ Cria data em UTC mantendo o dia fixo
  const now = new Date();
  
  // Calcula a hora de Brasília (UTC-3)
  let brasiliaHour = now.getUTCHours() - 3;
  
  // Se a hora ficar negativa, ajusta para o mesmo dia
  if (brasiliaHour < 0) {
    brasiliaHour += 24; // -1 vira 23h
  }
  
  const date = new Date(Date.UTC(
    parseInt(ano),
    parseInt(mes) - 1,
    parseInt(dia),
    brasiliaHour,
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  
  return date;
}
