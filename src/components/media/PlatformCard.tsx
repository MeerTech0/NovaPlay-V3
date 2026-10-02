import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Layers } from 'lucide-react';
import { Platform } from '../../services/platforms';
import { PlatformIcon } from './PlatformIcon';

interface PlatformCardProps {
  platform: Platform;
  index?: number;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ platform, index = 0 }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={() => navigate(`/platform/${platform.id}`)}
      data-cursor="button"
      className="group relative cursor-pointer rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-[#0E1018]/80 hover:bg-[#151826]/90 border border-white/[0.08] hover:border-white/[0.22] backdrop-blur-xl shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
      style={{
        boxShadow: `0 10px 30px -10px rgba(0, 0, 0, 0.6)`,
      }}
    >
      {/* Subtle Platform-Colored Ambient Radial Light */}
      <div
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: platform.accentColor }}
      />

      {/* Subtle top reflection sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Top Header: Platform Icon + Badge */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
          <div className="relative p-2 rounded-2xl bg-black/40 border border-white/[0.08] group-hover:border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <PlatformIcon platformId={platform.id} size="lg" />
          </div>

          <span
            className="text-[10px] sm:text-[11px] font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold border"
            style={{
              backgroundColor: `${platform.accentColor}18`,
              borderColor: `${platform.accentColor}40`,
              color: platform.id === 'apple-tv' ? '#FFFFFF' : platform.accentColor,
            }}
          >
            {platform.badge}
          </span>
        </div>

        {/* Platform Name & Category */}
        <div className="space-y-1 mb-3">
          <h3 className="text-lg sm:text-xl font-bold font-display text-white group-hover:text-white transition-colors flex items-center gap-2">
            <span>{platform.name}</span>
          </h3>
          <p className="text-xs font-semibold tracking-wide text-zinc-400 group-hover:text-zinc-300 transition-colors">
            {platform.category}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4">
          {platform.description}
        </p>
      </div>

      {/* Footer: Title Count & Explore Action */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <span>{platform.titlesAvailable}</span>
        </span>

        <span className="inline-flex items-center gap-1 font-semibold text-white group-hover:translate-x-1 transition-transform">
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
        </span>
      </div>
    </motion.div>
  );
};
