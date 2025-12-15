import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Users, Package, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const stats = useLiveQuery(async () => {
    const productsCount = await db.products.count();
    const partiesCount = await db.parties.count();
    const invoices = await db.invoices.toArray();
    
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const recentInvoices = invoices.sort((a, b) => b.id! - a.id!).slice(0, 5);

    return { productsCount, partiesCount, invoicesCount: invoices.length, totalRevenue, recentInvoices };
  });

  if (!stats) return <div className="p-8">Loading stats...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500">Lifetime sales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Invoices</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoicesCount}</div>
            <p className="text-xs text-gray-500">Total generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Parties</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partiesCount}</div>
            <p className="text-xs text-gray-500">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Products</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsCount}</div>
            <p className="text-xs text-gray-500">In inventory</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentInvoices.length === 0 && <p className="text-gray-500 text-sm">No recent invoices.</p>}
              {stats.recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{inv.invoiceNo}</span>
                    <span className="text-xs text-gray-500">{inv.partyName}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm">{formatCurrency(inv.grandTotal)}</span>
                    <span className="text-xs text-gray-400">{new Date(inv.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <Link to="/billing" className="block w-full bg-white/10 hover:bg-white/20 p-4 rounded-lg flex items-center gap-3 transition-colors">
                <div className="bg-white p-2 rounded-full text-blue-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Create New Invoice</div>
                  <div className="text-xs text-blue-100">Bill a customer</div>
                </div>
             </Link>

             <Link to="/products" className="block w-full bg-white/10 hover:bg-white/20 p-4 rounded-lg flex items-center gap-3 transition-colors">
                <div className="bg-white p-2 rounded-full text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Update Inventory</div>
                  <div className="text-xs text-blue-100">Add or edit products</div>
                </div>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}