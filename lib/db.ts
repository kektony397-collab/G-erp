import Dexie, { Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  hsn: string;
  price: number; // Base price
  taxRate: number; // GST %
  stock: number;
}

export interface Party {
  id?: number;
  name: string;
  gstin: string;
  mobile: string;
  address: string;
  state: string;
  email?: string;
}

export interface InvoiceItem extends Product {
  quantity: number;
  totalBase: number; // price * quantity
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  finalAmount: number; // totalBase + totalTax
}

export interface Invoice {
  id?: number;
  invoiceNo: string;
  date: Date;
  partyId: number;
  partyName: string; // Denormalized for search
  items: InvoiceItem[];
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
}

class GopiDatabase extends Dexie {
  products!: Table<Product>;
  parties!: Table<Party>;
  invoices!: Table<Invoice>;

  constructor() {
    super('GopiDistributorsDB');
    (this as any).version(1).stores({
      products: '++id, name, hsn',
      parties: '++id, name, gstin, mobile',
      invoices: '++id, invoiceNo, date, partyId, partyName'
    });
  }
}

export const db = new GopiDatabase();