import Navbar from '@/components/Navbar';

export default function Design() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Full-bleed optimizer. No form, no gating — the optimizer is the page. */}
      <div className="flex-1 pt-16">
        <iframe
          src={`/arqiteq_v7.html?v=7&t=${Date.now()}`}
          title="Junction Doping Optimizer"
          className="w-full"
          style={{
            height: 'calc(100vh - 64px)',
            border: 0,
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
