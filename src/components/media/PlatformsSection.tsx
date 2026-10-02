import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PLATFORMS } from '../../services/platforms';
import { PlatformIcon } from './PlatformIcon';

export const PlatformsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-6 sm:py-8 relative z-20" aria-label="Streaming Platforms">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Glass Section Header */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[var(--nova-accent)]" />
            <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-tight flex items-center gap-2">
              <span>All Platforms</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
              • Stream by Network
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/platforms')}
            data-cursor="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--nova-accent)] hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Single Row of Platform Icons */}
        {/* On desktop: 8 items in 1 single row. On mobile: single horizontal scrollable row */}
        <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none">
          {PLATFORMS.map((platform, idx) => (
            <motion.div
              key={`plat-icon-${platform.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/platform/${platform.id}`)}
              data-cursor="button"
              className="group flex-shrink-0 w-24 sm:w-auto flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl bg-[#0E1018]/80 hover:bg-[#151826] border border-white/[0.08] hover:border-white/[0.22] backdrop-blur-xl shadow-md transition-all duration-300 cursor-pointer text-center relative overflow-hidden"
              style={{
                boxShadow: `0 4px 16px -4px rgba(0, 0, 0, 0.5)`,
              }}
            >
              {/* Subtle Platform-Colored Glow on Hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none rounded-2xl blur-md"
                style={{ backgroundColor: platform.accentColor }}
              />

              {/* Large Platform Icon */}
              <div className="relative mb-2 transition-transform duration-300 group-hover:scale-110">
                <PlatformIcon platformId={platform.id} size="md" />
              </div>

              {/* Platform Name */}
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors truncate max-w-full">
                {platform.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
