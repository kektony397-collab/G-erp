import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '../lib/db';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import ProductForm from '../components/forms/ProductForm';
import { Plus, Edit2, Trash2, Search, Package, Upload, Loader2, X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';

// Worker code as a string to avoid build configuration issues with imports
const WORKER_CODE = `
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

self.onmessage = async (e) => {
  try {
    const data = new Uint8Array(e.data);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const mappedData = jsonData.map((row) => {
      // Flexible field matching helper
      const getVal = (keys) => {
        for (const k of keys) {
            // Exact match
            if (row[k] !== undefined) return row[k];
            // Case insensitive match
            const found = Object.keys(row).find(rKey => rKey.toLowerCase() === k.toLowerCase());
            if (found) return row[found];
        }
        return undefined;
      };

      return {
        name: getVal(['Item Name', 'Product', 'Name', 'Product Name']) || 'Unknown',
        hsn: String(getVal(['HSN', 'HSN Code']) || ''),
        price: Number(getVal(['Rate', 'Price', 'Base Price', 'Ptr', 'MRP']) || 0),
        taxRate: Number(getVal(['GST', 'Tax', 'Tax Rate']) || 0),
        stock: Number(getVal(['Stock', 'Qty', 'Quantity']) || 0)
      };
    }).filter(p => p.name !== 'Unknown');

    self.postMessage({ type: 'DONE', data: mappedData });
  } catch (err) {
    self.postMessage({ type: 'ERROR', error: err.message });
  }
};
`;

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const workerRef = useRef<Worker | null>(null);

  const products = useLiveQuery(async () => {
    // Optimization: limit results if no search to prevent rendering 50k rows at once
    if (!search) return await db.products.limit(100).toArray();
    return await db.products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.hsn.includes(search))
      .limit(100) // Always limit for performance
      .toArray();
  }, [search]);

  // Setup Worker
  useEffect(() => {
    const blob = new Blob([WORKER_CODE], { type: "application/javascript" });
    workerRef.current = new Worker(URL.createObjectURL(blob), { type: "module" });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

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
    if (!file || !workerRef.current) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportStatus("Reading file...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Send to worker
      workerRef.current.postMessage(arrayBuffer);

      workerRef.current.onmessage = async (event) => {
        const { type, data, error } = event.data;

        if (type === 'ERROR') {
          alert(`Import failed: ${error}`);
          setIsImporting(false);
          return;
        }

        if (type === 'DONE') {
          const productsToImport = data as Product[];
          
          if (productsToImport.length === 0) {
            alert('No valid products found.');
            setIsImporting(false);
            return;
          }

          setImportStatus(`Found ${productsToImport.length} products. Saving to database...`);

          // Chunked Insert to prevent UI freezing
          const CHUNK_SIZE = 2000;
          const total = productsToImport.length;
          
          try {
            // Process in chunks to allow UI updates
            for (let i = 0; i < total; i += CHUNK_SIZE) {
              const chunk = productsToImport.slice(i, i + CHUNK_SIZE);
              await db.products.bulkAdd(chunk);
              
              const progress = Math.round(((i + chunk.length) / total) * 100);
              setImportProgress(progress);
              setImportStatus(`Imported ${i + chunk.length} of ${total} products...`);
              
              // Yield to main thread to let React render the progress bar
              await new Promise(resolve => setTimeout(resolve, 10));
            }

            setImportStatus("Complete!");
            setTimeout(() => setIsImporting(false), 1000);
            
          } catch (dbError) {
             console.error(dbError);
             alert("Database error during import. Some products might be duplicates.");
             setIsImporting(false);
          }
        }
      };

    } catch (error) {
      console.error('Error importing file:', error);
      alert('Failed to process the file.');
      setIsImporting(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Import Modal Overlay */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Importing Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{importStatus}</span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Please wait while we process your data. This may take a moment for large files.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
            <Upload className="w-4 h-4 mr-2" /> Import Excel
          </Button>
          <Button onClick={() => setIsFormOpen(true)} disabled={isImporting}>
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
        {search && (
            <span className="text-sm text-gray-500">Showing matches for "{search}"</span>
        )}
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
                    {search ? 'No matches found.' : 'No products found. Add one or import via Excel.'}
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
        {!search && (
            <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
                Showing first 100 items. Use search to find specific products.
            </div>
        )}
      </div>
    </div>
  );
}