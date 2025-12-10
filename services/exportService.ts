import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Transaction } from "../types";

export const exportToPDF = (transactions: Transaction[], period: string) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text(`Laporan Keuangan SakuPintar`, 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Periode: ${period}`, 14, 30);

  // Summary
  const income = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;

  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text(`Total Pemasukan: Rp ${income.toLocaleString('id-ID')}`, 14, 40);
  doc.text(`Total Pengeluaran: Rp ${expense.toLocaleString('id-ID')}`, 14, 46);
  doc.text(`Sisa Saldo: Rp ${balance.toLocaleString('id-ID')}`, 14, 52);

  // Table
  const tableData = transactions.map(t => [
    t.date.split('T')[0],
    t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
    t.category,
    t.description || '-',
    `Rp ${t.amount.toLocaleString('id-ID')}`
  ]);

  autoTable(doc, {
    head: [['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah']],
    body: tableData,
    startY: 60,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [240, 253, 244] }, // Emerald-50
  });

  doc.save(`Laporan_Keuangan_${period.replace(/\s+/g, '_')}.pdf`);
};

export const exportToExcel = (transactions: Transaction[], period: string) => {
  const data = transactions.map(t => ({
    Tanggal: t.date.split('T')[0],
    Tipe: t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
    Kategori: t.category,
    Deskripsi: t.description,
    Jumlah: t.amount
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
  
  // Auto-width for columns (simple approximation)
  const wscols = [
    {wch: 12}, // Tanggal
    {wch: 12}, // Tipe
    {wch: 20}, // Kategori
    {wch: 30}, // Deskripsi
    {wch: 15}  // Jumlah
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Laporan_Keuangan_${period.replace(/\s+/g, '_')}.xlsx`);
};