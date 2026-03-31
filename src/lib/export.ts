import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Sale, Product, Expense, CashFlowEntry } from "./storage";

// Utilitário para converter array 2D em CSV e fazer download
const downloadCSV = (data: (string | number)[][], filename: string) => {
  const csvContent = data
    .map(row =>
      row.map(cell => {
        const str = String(cell ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    )
    .join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Exportar relatório financeiro em PDF
export const exportFinancialReportPDF = (
  sales: Sale[],
  expenses: Expense[],
  period: string
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Relatório Financeiro - GESTUM", 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Período: ${period}`, 14, 28);
  doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);
  
  const totalReceitas = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDespesas = expenses
    .filter(e => e.status === "paid")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const lucro = totalReceitas - totalDespesas;
  
  doc.setFontSize(12);
  doc.text("Resumo Financeiro", 14, 45);
  doc.setFontSize(10);
  doc.text(`Total de Receitas: R$ ${totalReceitas.toFixed(2)}`, 14, 52);
  doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 14, 58);
  doc.text(`Lucro Líquido: R$ ${lucro.toFixed(2)}`, 14, 64);
  
  doc.setFontSize(12);
  doc.text("Vendas Recentes", 14, 75);
  
  const salesData = sales.slice(-10).reverse().map(sale => [
    new Date(sale.date).toLocaleDateString("pt-BR"),
    `R$ ${sale.total.toFixed(2)}`,
    sale.paymentMethod,
    sale.status === "completed" ? "Concluída" : "Pendente",
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [["Data", "Valor", "Pagamento", "Status"]],
    body: salesData,
  });
  
  doc.save(`relatorio-financeiro-${new Date().getTime()}.pdf`);
};

// Exportar relatório financeiro em CSV (substitui Excel)
export const exportFinancialReportExcel = (
  sales: Sale[],
  expenses: Expense[],
  period: string
) => {
  const totalReceitas = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDespesas = expenses
    .filter(e => e.status === "paid")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const lucro = totalReceitas - totalDespesas;

  const data: (string | number)[][] = [
    ["Relatório Financeiro - GESTUM"],
    [`Período: ${period}`],
    [`Data: ${new Date().toLocaleDateString("pt-BR")}`],
    [],
    ["Resumo Financeiro"],
    ["Total de Receitas", `R$ ${totalReceitas.toFixed(2)}`],
    ["Total de Despesas", `R$ ${totalDespesas.toFixed(2)}`],
    ["Lucro Líquido", `R$ ${lucro.toFixed(2)}`],
    [],
    ["Vendas"],
    ["Data", "Valor", "Forma de Pagamento", "Status"],
    ...sales.map(sale => [
      new Date(sale.date).toLocaleDateString("pt-BR"),
      sale.total,
      sale.paymentMethod,
      sale.status === "completed" ? "Concluída" : "Pendente",
    ]),
    [],
    ["Despesas"],
    ["Nome", "Valor", "Vencimento", "Status", "Categoria"],
    ...expenses.map(exp => [
      exp.name,
      exp.amount,
      new Date(exp.dueDate).toLocaleDateString("pt-BR"),
      exp.status === "paid" ? "Pago" : exp.status === "overdue" ? "Vencido" : "Pendente",
      exp.category,
    ]),
  ];

  downloadCSV(data, `relatorio-financeiro-${new Date().getTime()}.csv`);
};

// Calcular previsão de estoque
export const calculateStockForecast = (
  product: Product,
  sales: Sale[],
  daysToForecast: number = 30
): {
  daysUntilStockout: number;
  averageDailySales: number;
  forecastDate: string;
  needsRestock: boolean;
} => {
  // Calcular vendas dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSales = sales.filter(
    sale => new Date(sale.date) >= thirtyDaysAgo
  );
  
  // Calcular média de vendas diárias do produto
  let totalSold = 0;
  recentSales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.productId === product.id) {
        totalSold += item.quantity;
      }
    });
  });
  
  const averageDailySales = totalSold / 30;
  
  // Calcular quantos dias até acabar o estoque
  const daysUntilStockout = averageDailySales > 0 
    ? Math.floor(product.quantity / averageDailySales)
    : Infinity;
  
  // Data prevista para acabar o estoque
  const forecastDate = new Date();
  if (daysUntilStockout !== Infinity) {
    forecastDate.setDate(forecastDate.getDate() + daysUntilStockout);
  }
  
  // Precisa reabastecer se acabar em menos de 15 dias
  const needsRestock = daysUntilStockout < 15 && daysUntilStockout !== Infinity;
  
  return {
    daysUntilStockout,
    averageDailySales,
    forecastDate: forecastDate.toLocaleDateString("pt-BR"),
    needsRestock,
  };
};
