export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  const date = new Date(`${ano}-${mes}-${dia}`);
  date.setHours(date.getHours() - 3); // Ajusta para UTC-3
  return date;
}
