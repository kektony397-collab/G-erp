import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceItem } from '../../lib/db';
import { COMPANY_DETAILS } from '../../lib/constants';
import { formatCurrency } from '../../lib/utils';

export const generatePDF = (invoice: Invoice, party: any) => {
  const doc = new jsPDF();

  // Company Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(COMPANY_DETAILS.name, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(COMPANY_DETAILS.address, 14, 28);
  doc.text(`${COMPANY_DETAILS.city}, ${COMPANY_DETAILS.state} - ${COMPANY_DETAILS.pincode}`, 14, 33);
  doc.text(`GSTIN: ${COMPANY_DETAILS.gstin}`, 14, 38);
  doc.text(`Phone: ${COMPANY_DETAILS.phone}`, 14, 43);

  // Invoice Details
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("TAX INVOICE", 150, 22);
  
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoice.invoiceNo}`, 150, 30);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 150, 35);

  // Bill To
  doc.line(14, 50, 196, 50);
  doc.setFontSize(11);
  doc.text("Bill To:", 14, 58);
  doc.setFontSize(10);
  doc.text(party.name, 14, 64);
  doc.text(party.address || '', 14, 69);
  doc.text(`State: ${party.state}`, 14, 74);
  doc.text(`GSTIN: ${party.gstin || 'Unregistered'}`, 14, 79);
  doc.text(`Mobile: ${party.mobile}`, 14, 84);

  // Items Table
  const tableColumn = ["#", "Item", "HSN", "Qty", "Rate", "Tax %", "Tax Amt", "Total"];
  const tableRows: any[] = [];

  invoice.items.forEach((item, index) => {
    const itemData = [
      index + 1,
      item.name,
      item.hsn,
      item.quantity,
      formatCurrency(item.price),
      `${item.taxRate}%`,
      formatCurrency(item.totalTax),
      formatCurrency(item.finalAmount)
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    startY: 90,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      7: { halign: 'right' },
      6: { halign: 'right' },
      4: { halign: 'right' },
    }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Sub Total:`, 140, finalY);
  doc.text(formatCurrency(invoice.subTotal), 190, finalY, { align: 'right' });

  doc.text(`Total Tax:`, 140, finalY + 6);
  doc.text(formatCurrency(invoice.taxTotal), 190, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total:`, 140, finalY + 14);
  doc.text(formatCurrency(invoice.grandTotal), 190, finalY + 14, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Signatory", 190, 270, { align: 'right' });
  doc.text("Thank you for your business!", 105, 280, { align: 'center' });

  doc.save(`${invoice.invoiceNo}.pdf`);
};