export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // obtém a hora ATUAL em UTC
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcSecond = now.getUTCSeconds();
  
  // subtrai 3 horas da UTC para obter hora de Brasília
  const brasiliaHour = utcHour - 3;
  
  // cria string ISO com timezone de Brasília
  const isoString = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${brasiliaHour.toString().padStart(2, '0')}:${utcMinute.toString().padStart(2, '0')}:${utcSecond.toString().padStart(2, '0')}-03:00`;
  
  const date = new Date(isoString);
  
  return date;
}
