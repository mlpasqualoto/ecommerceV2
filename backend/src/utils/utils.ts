export function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
};

export function parseDataBr(dataBr: string): Date {
  // Extrai dia/mês/ano da string brasileira
  const [dia, mes, ano] = dataBr.split('/');
  
  // Cria a data com a hora atual do sistema
  const now = new Date();
  const date = new Date(`${ano}-${mes}-${dia}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
  
  // Ajusta para UTC-3 (Brasília)
  date.setHours(date.getHours() - 3);
  
  return date;
}
