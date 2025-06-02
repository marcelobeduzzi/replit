import StockCheckForm from '@/components/stock-check-form';

export default function NewStockCheckPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Nuevo Control de Stock</h1>
      <StockCheckForm />
    </div>
  );
}