import StockCheckList from '@/components/stock-check-list';

export default function StockCheckPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Control de Stock</h1>
      <StockCheckList />
    </div>
  );
}