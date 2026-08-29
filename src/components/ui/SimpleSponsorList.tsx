import React, { useMemo } from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { Eye, Plus, Sparkles, User, ArrowUpRight, Trophy } from 'lucide-react';

export const SimpleSponsorList: React.FC<{ onNavigateTo3D?: () => void }> = () => {
  const {
    sponsors,
    focusSponsor,
    setIsBuyModalOpen,
  } = useSponsors();

  // Sorted strictly by contribution amount ($MXN) descending
  const sortedSponsors = useMemo(() => {
    return [...sponsors].sort((a, b) => b.totalPriceMxn - a.totalPriceMxn);
  }, [sponsors]);

  return (
    <section id="sponsors" className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-black/[0.08]">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-amber-700 font-bold block mb-1.5 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Tabla Oficial de Posiciones</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-neutral-950 tracking-tight">
              Ranking de Patrocinadores
            </h2>
            <p className="text-xs text-neutral-600 mt-1 font-sans font-medium">
              Ordenados exclusivamente por monto de aportación económica ($MXN) a la campaña.
            </p>
          </div>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#D5001C] hover:bg-[#b00017] text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow-md shadow-red-950/20 cursor-pointer self-start sm:self-auto shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Unirme como Patrocinador</span>
          </button>
        </div>

        {/* Empty State */}
        {sortedSponsors.length === 0 ? (
          <div className="p-10 sm:p-12 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto text-xl shadow-xs">
              👑
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-heading font-bold text-neutral-900">
                La posición #1 del Ranking está disponible
              </h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto font-sans leading-relaxed font-medium">
                Aún no hay patrocinadores registrados. Sube tu logo y sé el patrocinador líder en el Porsche 911 (992).
              </p>
            </div>
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow-sm cursor-pointer uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Conquistar la Posición #1</span>
            </button>
          </div>
        ) : (
          /* Simple List Sorted by Aportación ($MXN) */
          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {sortedSponsors.map((sponsor, index) => {
              const displayName = sponsor.sponsorName || sponsor.brandName;

              return (
                <div
                  key={sponsor.id}
                  className="py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 px-2 rounded-2xl transition"
                >
                  {/* Left: Rank, Avatar & Account Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`font-mono text-xs font-black w-7 text-center shrink-0 ${
                      index === 0 ? 'text-amber-600' : index === 1 ? 'text-slate-600' : index === 2 ? 'text-amber-800' : 'text-neutral-500'
                    }`}>
                      #{index + 1}
                    </span>

                    {/* Profile photo / Logo */}
                    <div className="w-11 h-11 rounded-full bg-white border border-neutral-300 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {sponsor.logoUrl ? (
                        <img
                          src={sponsor.logoUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>

                    {/* Account Name and Slogan */}
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-neutral-950 truncate">
                        {displayName}
                      </div>
                      {sponsor.slogan && (
                        <div className="text-xs text-neutral-600 truncate font-medium">
                          "{sponsor.slogan}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Aportación ($MXN), Size & 3D Action */}
                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <span className="font-black text-neutral-950 text-sm block">
                        ${sponsor.totalPriceMxn.toLocaleString()} MXN
                      </span>
                      <span className="text-[11px] text-neutral-600 font-semibold block">
                        {sponsor.areaCm2.toLocaleString()} cm² · {sponsor.zoneName}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        focusSponsor(sponsor.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-mono font-medium shadow-xs"
                      title="Ver en el auto 3D"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver en 3D</span>
                    </button>

                    {sponsor.targetUrl && (
                      <a
                        href={sponsor.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition"
                        title="Visitar enlace"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
