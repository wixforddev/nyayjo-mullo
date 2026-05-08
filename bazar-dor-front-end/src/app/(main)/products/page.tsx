import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { AllProducts } from './AllProducts';

export default function ProductsPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-slate-400">লোড হচ্ছে...</div>}>
        <AllProducts />
      </Suspense>
    </Layout>
  );
}
