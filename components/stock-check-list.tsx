'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search } from 'lucide-react';
import { getSupabase } from '@/lib/db';

interface StockItem {
  id: string;
  product_id: string;
  quantity: number;
  local_id: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    category: string;
    description?: string;
  };
  local?: {
    id: string;
    name: string;
  };
}

export default function StockCheckList() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [locals, setLocals] = useState<any[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = getSupabase();

  useEffect(() => {
    async function loadData() {
      try {
        // Cargar locales
        const { data: localsData, error: localsError } = await supabase
          .from('locals')
          .select('id, name')
          .order('name');

        if (localsError) throw localsError;
        setLocals(localsData || []);

        // Si hay locales, seleccionar el primero por defecto
        if (localsData && localsData.length > 0) {
          setSelectedLocal(localsData[0].id);
          await loadStockItems(localsData[0].id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function loadStockItems(localId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock')
        .select(`
          *,
          product:product_id (*),
          local:local_id (*)
        `)
        .eq('local_id', localId);

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error al cargar stock:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const localId = e.target.value;
    setSelectedLocal(localId);
    loadStockItems(localId);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  // Filtrar items por término de búsqueda
  const filteredItems = stockItems.filter(item => 
    item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="w-full md:w-64">
            <Label htmlFor="local">Local</Label>
            <select
              id="local"
              value={selectedLocal}
              onChange={handleLocalChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={loading}
            >
              {locals.map(local => (
                <option key={local.id} value={local.id}>
                  {local.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-64 relative">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Input
                id="search"
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        
        <Link href="/stock-check/new" className="mt-4 md:mt-0">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo Ajuste
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay productos en stock para este local.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Actualización
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product?.name || 'Producto desconocido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product?.category || 'Sin categoría'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <span className={`font-medium ${item.quantity <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {new Date(item.updated_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}