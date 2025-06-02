'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getSupabase } from '@/lib/db';

export default function StockCheckForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locals, setLocals] = useState([]);
  const [products, setProducts] = useState([]);
  const formRef = useRef<HTMLFormElement>(null);
  const supabase = getSupabase();

  // Cargar locales y productos al montar el componente
  useState(() => {
    async function loadData() {
      try {
        // Cargar locales
        const { data: localsData, error: localsError } = await supabase
          .from('locals')
          .select('id, name')
          .order('name');

        if (localsError) throw localsError;
        setLocals(localsData || []);

        // Cargar productos
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, category')
          .order('name');

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;

    setLoading(true);
    try {
      const formData = new FormData(formRef.current);
      const localId = formData.get('local_id') as string;
      const productId = formData.get('product_id') as string;
      const quantity = parseInt(formData.get('quantity') as string, 10);
      const reason = formData.get('reason') as string;

      // Verificar datos
      if (!localId || !productId || isNaN(quantity) || !reason) {
        alert('Por favor complete todos los campos correctamente');
        return;
      }

      // Obtener stock actual
      const { data: currentStock, error: stockError } = await supabase
        .from('stock')
        .select('quantity')
        .eq('product_id', productId)
        .eq('local_id', localId)
        .single();

      const previousQuantity = currentStock?.quantity || 0;

      // Registrar ajuste
      const { error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert([
          {
            product_id: productId,
            quantity,
            previous_quantity: previousQuantity,
            reason,
            local_id: localId,
            created_at: new Date().toISOString()
          }
        ]);

      if (adjustmentError) throw adjustmentError;

      // Actualizar stock
      const newQuantity = previousQuantity + quantity;
      
      if (currentStock) {
        // Actualizar stock existente
        const { error: updateError } = await supabase
          .from('stock')
          .update({ 
            quantity: newQuantity, 
            updated_at: new Date().toISOString() 
          })
          .eq('product_id', productId)
          .eq('local_id', localId);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo registro de stock
        const { error: insertError } = await supabase
          .from('stock')
          .insert([{
            product_id: productId,
            local_id: localId,
            quantity: newQuantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      // Redireccionar a la página de stock
      router.push('/stock');
      router.refresh();
    } catch (error) {
      console.error('Error al guardar ajuste de stock:', error);
      alert('Error al guardar el ajuste de stock. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="local_id">Local</Label>
          <select 
            id="local_id" 
            name="local_id" 
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Seleccionar local</option>
            {locals.map((local: any) => (
              <option key={local.id} value={local.id}>
                {local.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_id">Producto</Label>
          <select 
            id="product_id" 
            name="product_id" 
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Seleccionar producto</option>
            {products.map((product: any) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad (positivo para agregar, negativo para restar)</Label>
        <Input 
          id="quantity" 
          name="quantity" 
          type="number" 
          required 
          placeholder="Ej: 10 o -5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo del ajuste</Label>
        <Textarea 
          id="reason" 
          name="reason" 
          required 
          placeholder="Explique el motivo del ajuste de stock"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar Ajuste'}
      </Button>
    </form>
  );
}