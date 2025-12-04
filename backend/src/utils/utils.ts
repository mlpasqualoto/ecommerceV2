export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  
  // cria data LOCAL do servidor (já considera timezone automaticamente)
  const date = new Date(
    parseInt(ano),
    parseInt(mes) - 1,
    parseInt(dia),
    new Date().getHours(),
    new Date().getMinutes(),
    new Date().getSeconds()
  );
  
  return date;
}
