import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, Party, InvoiceItem } from '../lib/db';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { calculateTax } from '../lib/taxCalc';
import { formatCurrency, generateInvoiceNumber } from '../lib/utils';
import { generatePDF } from '../components/invoice/InvoiceGenerator';
import { Trash2, Printer, Save, PlusCircle, Search } from 'lucide-react';

export default function BillingPage() {
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Product Search State
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);

  const parties = useLiveQuery(() => db.parties.toArray());
  const products = useLiveQuery(async () => {
    if (!productSearch) return [];
    return await db.products
      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
      .limit(5)
      .toArray();
  }, [productSearch]);

  // Derived State
  const selectedParty = parties?.find(p => p.id === Number(selectedPartyId));
  
  const totals = items.reduce((acc, item) => ({
    subTotal: acc.subTotal + item.totalBase,
    taxTotal: acc.taxTotal + item.totalTax,
    grandTotal: acc.grandTotal + item.finalAmount
  }), { subTotal: 0, taxTotal: 0, grandTotal: 0 });

  const addItem = () => {
    if (!selectedProduct || !selectedParty) return;
    
    // Check stock if needed (omitted for speed)
    const taxDetails = calculateTax(selectedProduct.price, qty, selectedProduct.taxRate, selectedParty.state);
    
    const newItem: InvoiceItem = {
      ...selectedProduct,
      quantity: qty,
      ...taxDetails
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setProductSearch('');
    setQty(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveAndPrint = async () => {
    if (!selectedParty || items.length === 0) return;
    
    setIsSaving(true);
    try {
      const lastInvoice = await db.invoices.orderBy('id').last();
      const lastId = lastInvoice?.id || 0;
      const invoiceNo = generateInvoiceNumber(lastId);

      const invoice = {
        invoiceNo,
        date: new Date(),
        partyId: selectedParty.id!,
        partyName: selectedParty.name,
        items,
        ...totals
      };

      await db.invoices.add(invoice);
      
      // Generate PDF
      generatePDF(invoice, selectedParty);
      
      // Reset Form
      setItems([]);
      setSelectedPartyId('');
    } catch (err) {
      console.error(err);
      alert("Error saving invoice");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
        <div className="text-sm text-gray-500">
          Date: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Party</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
                >
                  <option value="">-- Choose Party --</option>
                  {parties?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedParty && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <p>{selectedParty.address}</p>
                    <p>GST: {selectedParty.gstin || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Product</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input 
                      className="pl-9"
                      placeholder="Type to search..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {products && products.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {products.map(p => (
                          <div 
                            key={p.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedProduct(p);
                              setProductSearch(p.name);
                            }}
                          >
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500">₹{p.price} | Stock: {p.stock}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedProduct && (
                  <div className="bg-blue-50 p-3 rounded-md space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{selectedProduct.name}</span>
                      <span>₹{selectedProduct.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="1" 
                        value={qty} 
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-20"
                      />
                      <Button size="sm" onClick={addItem} className="flex-1">
                        <PlusCircle className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Invoice Preview */}
        <div className="lg:col-span-2">
          <Card className="min-h-[500px] flex flex-col">
            <CardContent className="flex-1 p-0">
              <div className="bg-gray-50 border-b p-4 grid grid-cols-12 text-xs font-semibold text-gray-600 uppercase">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Item</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Tax</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              
              <div className="divide-y">
                {items.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    Add items to create an invoice
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="p-4 grid grid-cols-12 items-center text-sm group hover:bg-gray-50">
                      <div className="col-span-1 text-gray-500">{idx + 1}</div>
                      <div className="col-span-4 font-medium">
                        {item.name}
                        <div className="text-xs text-gray-400">HSN: {item.hsn}</div>
                      </div>
                      <div className="col-span-2 text-right">{formatCurrency(item.price)}</div>
                      <div className="col-span-1 text-center">{item.quantity}</div>
                      <div className="col-span-2 text-right text-xs">
                        <div>{formatCurrency(item.totalTax)}</div>
                        <div className="text-gray-400">({item.taxRate}%)</div>
                      </div>
                      <div className="col-span-2 text-right font-medium relative">
                        {formatCurrency(item.finalAmount)}
                        <button 
                          onClick={() => removeItem(idx)}
                          className="absolute -right-2 -top-1 opacity-0 group-hover:opacity-100 text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>

            <div className="border-t p-6 bg-gray-50">
              <div className="flex flex-col gap-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Tax:</span>
                  <span>{formatCurrency(totals.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
                
                <Button 
                  className="mt-4 w-full" 
                  onClick={handleSaveAndPrint}
                  disabled={items.length === 0 || !selectedParty || isSaving}
                >
                  {isSaving ? (
                    'Generating...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save & Print
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}