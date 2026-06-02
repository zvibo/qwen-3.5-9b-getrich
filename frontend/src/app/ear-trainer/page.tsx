'use client';

import dynamic from 'next/dynamic';

const EarTrainerApp = dynamic(
  () => import('@/components/EarTrainer/EarTrainerApp'),
  { ssr: false, loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
      Loading ear trainer…
    </div>
  )},
);

export default function EarTrainerPage() {
  return <EarTrainerApp />;
}
