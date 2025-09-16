export function formatCurrencyBRL(value) {
    if (value === null || value === undefined || value === "") return "R$ 0,00";

    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}
