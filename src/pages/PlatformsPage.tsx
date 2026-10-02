import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv2, Search } from 'lucide-react';
import { PLATFORMS } from '../services/platforms';
import { PlatformCard } from '../components/media/PlatformCard';

export const PlatformsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlatforms = PLATFORMS.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#07080B] text-white pt-24 sm:pt-28 pb-20 selection:bg-purple-500/30 selection:text-purple-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Header in Glass Container */}
        <div className="relative rounded-3xl p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-[#121420]/90 via-[#0E1018]/80 to-[#0A0C14]/90 border border-white/[0.08] backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Subtle Ambient Purplish Glow in Background */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono uppercase tracking-wider mb-4">
              <Tv2 className="w-3.5 h-3.5" />
              <span>Studio & Network Hubs</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white mb-3">
              Browse by Platform
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
              Explore acclaimed television, theatrical masterworks, and binge-worthy exclusives organized by global streaming network, franchise studio, and prestige production house.
            </p>

            {/* Search Filter Input */}
            <div className="mt-6 max-w-md relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by platform name or franchise..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-purple-500/60 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-md"
              />
            </div>
          </div>
        </div>

        {/* Platform Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
            <span>SHOWING {filteredPlatforms.length} PLATFORMS</span>
            <span className="hidden sm:inline">AUTHENTIC TMDB DATA INTEGRATION</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredPlatforms.map((platform, idx) => (
              <PlatformCard key={platform.id} platform={platform} index={idx} />
            ))}
          </div>

          {filteredPlatforms.length === 0 && (
            <div className="text-center py-16 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-sm text-zinc-400">No platforms matched "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-[var(--nova-accent)] hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
