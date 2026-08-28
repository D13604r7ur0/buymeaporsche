import React from 'react';
import { useSponsors } from '../../context/SponsorContext';
import { Search, Camera, Plus } from 'lucide-react';

export const SponsorDirectory: React.FC<{ onNavigateTo3D: () => void }> = ({ onNavigateTo3D }) => {
  const {
    filteredSponsors,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTierFilter,
    setSelectedTierFilter,
    setSelectedSponsor,
    focusSponsor,
    setIsBuyModalOpen,
  } = useSponsors();

  const categories = [
    'all',
    'Tecnología & AI',
    'Finanzas & Cripto',
    'Moda & Lujo',
    'Motorsport & Tuning',
    'Gastronomía & Bebidas',
    'Fitness & Deporte',
    'Startups & Software',
    'Agencias & Medios',
  ];

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 block mb-2">
              Hall of Fame
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-neutral-900 tracking-tight">
              Marcas Patrocinadoras
            </h2>
            <p className="text-sm text-neutral-500 mt-2 font-sans">
              Explora las marcas que forman parte del Porsche 911 (992). Haz clic en cualquiera para enfocar la cámara 3D sobre su ubicación.
            </p>
          </div>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition shadow-sm cursor-pointer self-start md:self-auto flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Mi Marca</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por marca o slogan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#fafafa] border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition"
              />
            </div>

            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="bg-[#fafafa] border border-black/10 rounded-xl px-4 py-2.5 text-xs text-neutral-700 focus:outline-none focus:border-neutral-900 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Todas las Zonas</option>
              <option value="vip_wing">Alerón / Trasera</option>
              <option value="hood_central">Cofre Central</option>
              <option value="premium_door">Puertas Laterales</option>
              <option value="body_standard">Salpicaderas & Facias</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'bg-[#fafafa] text-neutral-600 hover:text-neutral-900 border border-black/[0.06]'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sponsors Grid */}
        {filteredSponsors.length === 0 ? (
          <div className="p-12 sm:p-16 text-center border border-dashed border-black/15 rounded-3xl bg-[#fafafa] space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center mx-auto text-2xl shadow-sm">
              🏎️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-heading font-bold text-neutral-900">
                Sé el primer patrocinador oficial en el Porsche 911
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto font-sans leading-relaxed">
                Los 120,000 cm² de la carrocería están 100% disponibles. Elige tu zona (cofre, puertas, alerón), sube tu logo y asegura tu presencia por 2 años.
              </p>
            </div>
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Colocar mi Logo en el Auto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] hover:border-black/20 hover:shadow-sm transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-3">
                    <span>{sponsor.zoneName}</span>
                    <span className="text-emerald-600 font-semibold">2 Años</span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {sponsor.logoUrl ? (
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.brandName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="font-bold text-neutral-900 text-xs">
                          {sponsor.brandName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-neutral-900 line-clamp-1">
                        {sponsor.brandName}
                      </h3>
                      <span className="text-[11px] text-neutral-500 font-sans block">
                        {sponsor.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-4">
                    {sponsor.slogan}
                  </p>

                  <div className="py-2 border-t border-black/[0.04] flex justify-between text-xs font-mono text-neutral-500 mb-4">
                    <span>{sponsor.widthCm}x{sponsor.heightCm} cm ({sponsor.areaCm2} cm²)</span>
                    <span className="text-neutral-900 font-bold">${sponsor.totalPriceMxn.toLocaleString()} MXN</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      focusSponsor(sponsor.id);
                      onNavigateTo3D();
                    }}
                    className="flex-1 bg-white hover:bg-neutral-900 text-neutral-700 hover:text-white border border-black/10 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Ver en 3D</span>
                  </button>

                  <button
                    onClick={() => setSelectedSponsor(sponsor)}
                    className="px-3 py-1.5 bg-[#fafafa] hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 rounded-xl border border-black/[0.06] text-xs transition cursor-pointer"
                  >
                    Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
