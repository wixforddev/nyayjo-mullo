import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { SubmitPrice } from './SubmitPrice';

export default function SubmitPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <SubmitPrice />
      </Suspense>
    </Layout>
  );
}
