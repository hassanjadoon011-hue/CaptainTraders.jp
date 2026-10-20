import { Globe, ShieldCheck, TrendingUp, Users } from 'lucide-react'

const BLUE = '#29ABE2'

export default function AboutPage() {
  return (
    <div
      className="w-full min-h-screen bg-[#F5F9FF]"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
    >

      {/* HERO */}
      <section
        className="w-full text-center px-6 relative overflow-hidden"
        style={{
          background: BLUE,
          paddingTop: 'calc(68px + 3rem)',
          paddingBottom: '4rem',
        }}
      >
        {/* subtle dot texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-3xl mx-auto">

          <span className="text-white/80 text-[11px] font-bold tracking-[0.18em] uppercase">
            About CaptainTraders.jp
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 mt-3">
            Connecting Japan's Auctions to the World
          </h1>

          <p className="text-white/75 text-[15px] leading-relaxed max-w-xl mx-auto">
            We provide direct access to Japanese auctions with verified inspection reports,
            transparent pricing, and full export handling — no unnecessary intermediaries.
          </p>

        </div>
      </section>

      {/* MISSION */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-4">
        
          <span
            className="text-[11px] font-bold tracking-[0.16em] uppercase"
            style={{ color: BLUE }}
          >
        Our Mission
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
          Transparency from Auction to Delivery
        </h2>

        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          We simplify global access to Japanese vehicles by removing unnecessary intermediaries
          and ensuring full transparency from auction bid to port delivery. Every vehicle comes
          with a verified inspection report and dedicated agent support.
        </p>
      </section>

      {/* VALUE BLOCKS */}
      <section className="bg-white border-y border-blue-100 py-12">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6">

          <div className="p-7 rounded-xl border border-blue-100 bg-[#F0FAFF]">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
              style={{ background: '#C8ECFC' }}
            >
              <Globe size={16} style={{ color: BLUE }} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Why Japanese Cars</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Strict inspection standards ensure high-quality used vehicles ideal for export markets worldwide.
            </p>
          </div>

          <div className="p-7 rounded-xl border border-blue-100 bg-[#F0FAFF]">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
              style={{ background: '#C8ECFC' }}
            >
              <ShieldCheck size={16} style={{ color: BLUE }} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Our Approach</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Direct auction access, verified inspection reports, and full export handling from Japan.
            </p>
          </div>

        </div>
      </section>

    </div>
  )
}