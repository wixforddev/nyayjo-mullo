import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { ProductDetail } from './ProductDetail';

interface PageProps {
  params: { productId: string };
}

export default function ProductDetailPage({ params }: PageProps) {
  return (
    <Layout>
      <Suspense fallback={
        <div className="max-w-lg mx-auto pt-8 animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded-2xl w-1/3" />
          <div className="h-40 bg-slate-100 rounded-3xl" />
          <div className="h-32 bg-slate-100 rounded-3xl" />
          <div className="h-48 bg-slate-100 rounded-3xl" />
        </div>
      }>
        <ProductDetail productId={params.productId} />
      </Suspense>
    </Layout>
  );
}
