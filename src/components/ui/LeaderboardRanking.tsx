import React, { useState, useMemo } from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { Trophy, Medal, Crown, ArrowUpRight, Search, Plus, Sparkles, Eye, User, Building } from 'lucide-react';

export const LeaderboardRanking: React.FC<{ onNavigateTo3D?: () => void }> = () => {
  const {
    sponsors,
    focusSponsor,
    setIsBuyModalOpen,
    totalAvailableCm2,
  } = useSponsors();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'area' | 'amount' | 'recent'>('area');

  // Sorted and filtered ranking
  const rankedSponsors = useMemo(() => {
    let list = [...sponsors];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.brandName.toLowerCase().includes(q) ||
          (s.sponsorName && s.sponsorName.toLowerCase().includes(q)) ||
          s.zoneName.toLowerCase().includes(q) ||
          s.slogan.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'area') {
      list.sort((a, b) => b.areaCm2 - a.areaCm2);
    } else if (sortBy === 'amount') {
      list.sort((a, b) => b.totalPriceMxn - a.totalPriceMxn);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [sponsors, searchQuery, sortBy]);

  const top3 = useMemo(() => {
    const list = [...sponsors].sort((a, b) => b.areaCm2 - a.areaCm2);
    return list.slice(0, 3);
  }, [sponsors]);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-xs shadow-sm font-mono">
          <Crown className="w-3.5 h-3.5 fill-current" />
          <span>#1 ORO</span>
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-900 font-bold text-xs shadow-sm font-mono">
          <Medal className="w-3.5 h-3.5 fill-current text-slate-600" />
          <span>#2 PLATA</span>
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-700/20 text-amber-900 font-bold text-xs shadow-sm font-mono">
          <Medal className="w-3.5 h-3.5 fill-current text-amber-700" />
          <span>#3 BRONCE</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 font-mono text-xs font-semibold">
        #{index + 1}
      </span>
    );
  };

  return (
    <section id="ranking" className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 block mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Tabla Oficial de Posiciones & Presencia</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-neutral-900 tracking-tight">
              Ranking de Patrocinadores por Tamaño (cm²)
            </h2>
            <p className="text-sm text-neutral-500 mt-2 font-sans">
              Entre más grande sea la superficie ($cm^2$) de tu logotipo en el Porsche 911 (992), mayor visibilidad y posición de honor obtendrás en la plataforma y en las tomas de pista.
            </p>
          </div>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-3 rounded-full transition shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Comprar Espacio & Entrar al Top</span>
          </button>
        </div>

        {/* Top 3 Podium Cards (If we have at least 1 sponsor) */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {top3.map((sponsor, idx) => (
              <div
                key={sponsor.id}
                className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                  idx === 0
                    ? 'bg-neutral-950 text-white border-amber-400/40 shadow-xl ring-1 ring-amber-400/20'
                    : 'bg-[#fafafa] text-neutral-900 border-black/[0.06] shadow-sm hover:border-black/20'
                }`}
              >
                {/* Background Glow for #1 */}
                {idx === 0 && (
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    {getRankBadge(idx)}
                    <span className={`text-[10px] font-mono ${idx === 0 ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {sponsor.zoneName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/10 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      {sponsor.logoUrl ? (
                        <img src={sponsor.logoUrl} alt={sponsor.brandName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-heading font-bold text-xs text-neutral-900">
                          {sponsor.brandName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="font-heading font-bold text-base tracking-wide truncate">
                        {sponsor.brandName}
                      </h4>
                      {sponsor.sponsorName && (
                        <div className={`text-xs flex items-center gap-1 font-sans truncate ${idx === 0 ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          <User className="w-3 h-3 shrink-0" />
                          <span>{sponsor.sponsorName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className={`text-xs font-sans line-clamp-2 mb-4 ${idx === 0 ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    "{sponsor.slogan}"
                  </p>
                </div>

                <div className={`pt-4 border-t ${idx === 0 ? 'border-white/10' : 'border-black/[0.06]'} flex items-center justify-between text-xs font-mono`}>
                  <div>
                    <span className={`text-[10px] block ${idx === 0 ? 'text-neutral-400' : 'text-neutral-400'}`}>Superficie:</span>
                    <strong className="text-emerald-400 text-sm">{sponsor.areaCm2.toLocaleString()} cm²</strong>
                  </div>

                  <button
                    onClick={() => {
                      focusSponsor(sponsor.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition flex items-center gap-1 cursor-pointer ${
                      idx === 0
                        ? 'bg-white text-neutral-950 hover:bg-neutral-200 font-semibold'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver en 3D</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls: Search & Sort Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-[#fafafa] p-4 rounded-2xl border border-black/[0.06]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-mono">
            <span className="text-neutral-500">Ordenar por:</span>
            <button
              onClick={() => setSortBy('area')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                sortBy === 'area' ? 'bg-neutral-900 text-white font-semibold' : 'bg-white text-neutral-700 border border-black/10'
              }`}
            >
              Tamaño (cm²)
            </button>
            <button
              onClick={() => setSortBy('amount')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                sortBy === 'amount' ? 'bg-neutral-900 text-white font-semibold' : 'bg-white text-neutral-700 border border-black/10'
              }`}
            >
              Inversión ($)
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                sortBy === 'recent' ? 'bg-neutral-900 text-white font-semibold' : 'bg-white text-neutral-700 border border-black/10'
              }`}
            >
              Recientes
            </button>
          </div>
        </div>

        {/* Full Ranking Table */}
        {rankedSponsors.length === 0 ? (
          <div className="p-12 sm:p-16 text-center border border-dashed border-black/15 rounded-3xl bg-[#fafafa] space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-2xl shadow-sm border border-amber-200">
              👑
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-heading font-bold text-neutral-900">
                La posición #1 del Ranking está disponible
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto font-sans leading-relaxed">
                Aún no hay patrocinadores registrados. Sube tu logo, define tus medidas en centímetros cuadrados ($cm^2$) y sé el líder indiscutible en la carrocería del Porsche 911.
              </p>
            </div>
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Conquistar la Posición #1</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-black/[0.06] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#fafafa] border-b border-black/[0.06] text-neutral-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Posición</th>
                    <th className="py-3.5 px-4">Patrocinador & Marca</th>
                    <th className="py-3.5 px-4">Zona en el 911</th>
                    <th className="py-3.5 px-4 text-right">Tamaño (cm²)</th>
                    <th className="py-3.5 px-4 text-right">Inversión</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Acción 3D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {rankedSponsors.map((sponsor, index) => {
                    const carCoveragePct = ((sponsor.areaCm2 / totalAvailableCm2) * 100).toFixed(2);
                    return (
                      <tr key={sponsor.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          {getRankBadge(index)}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white border border-black/10 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                              {sponsor.logoUrl ? (
                                <img src={sponsor.logoUrl} alt={sponsor.brandName} className="w-full h-full object-contain" />
                              ) : (
                                <span className="font-bold text-neutral-900 text-xs">
                                  {sponsor.brandName.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-sans font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span>{sponsor.brandName}</span>
                              </div>
                              {sponsor.sponsorName && (
                                <div className="text-[11px] text-neutral-500 font-sans flex items-center gap-1 mt-0.5">
                                  <User className="w-3 h-3 text-neutral-400 shrink-0" />
                                  <span>{sponsor.sponsorName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[11px]">
                            {sponsor.zoneName}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <strong className="text-emerald-600 font-bold text-sm">
                            {sponsor.areaCm2.toLocaleString()} cm²
                          </strong>
                          <span className="text-[10px] text-neutral-400 block font-normal">
                            ({sponsor.widthCm}x{sponsor.heightCm} cm · {carCoveragePct}% auto)
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <span className="text-neutral-900 font-bold">
                            ${sponsor.totalPriceMxn.toLocaleString()} MXN
                          </span>
                          <span className="text-[10px] text-neutral-400 block font-normal">
                            ${(sponsor.totalPriceMxn / 730).toFixed(2)}/día
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                focusSponsor(sponsor.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white transition cursor-pointer"
                              title="Enfocar en el modelo 3D"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {sponsor.targetUrl && (
                              <a
                                href={sponsor.targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition"
                                title="Visitar sitio web"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
