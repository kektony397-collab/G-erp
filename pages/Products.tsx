import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '../lib/db';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import ProductForm from '../components/forms/ProductForm';
import { Plus, Edit2, Trash2, Search, Package, Upload } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import * as XLSX from 'xlsx';

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const products = useLiveQuery(async () => {
    if (!search) return await db.products.toArray();
    return await db.products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.hsn.includes(search))
      .toArray();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await db.products.delete(id);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingProduct(undefined);
    setIsFormOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Map Excel columns to Product interface
      const mappedProducts: Product[] = jsonData.map((row: any) => ({
        name: row['Item Name'] || row['Product'] || row['Name'] || row['Product Name'] || 'Unknown',
        hsn: String(row['HSN'] || row['HSN Code'] || ''),
        price: Number(row['Rate'] || row['Price'] || row['Base Price'] || row['Ptr'] || 0),
        taxRate: Number(row['GST'] || row['Tax'] || row['Tax Rate'] || 0),
        stock: Number(row['Stock'] || row['Qty'] || row['Quantity'] || 0)
      })).filter(p => p.name !== 'Unknown'); // Simple validation

      if (mappedProducts.length > 0) {
        await db.products.bulkAdd(mappedProducts);
        alert(`Successfully imported ${mappedProducts.length} products!`);
      } else {
        alert('No valid products found in the file. Please check column names.');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Failed to process the file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your inventory and pricing.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload} 
          />
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="w-4 h-4 mr-2" /> Import Excel
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader>
            <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm 
              onSuccess={handleCloseForm} 
              onCancel={handleCloseForm}
              initialData={editingProduct} 
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            className="pl-9" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">HSN</th>
                <th className="px-6 py-3">Price (Excl. Tax)</th>
                <th className="px-6 py-3">Tax %</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    No products found. Add one or import via Excel.
                  </td>
                </tr>
              )}
              {products?.map((product) => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-gray-500">{product.hsn}</td>
                  <td className="px-6 py-4">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.taxRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}