import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Planner } from './Planner';

export default function PlannerPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Planner />
      </Suspense>
    </Layout>
  );
}
