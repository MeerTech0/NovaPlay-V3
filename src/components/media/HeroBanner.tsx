import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../../types/media';
import { getBackdropUrl } from '../../services/tmdb';
import { useSettings } from '../../context/SettingsContext';

interface HeroBannerProps {
  media?: MediaItem | null;
  items?: MediaItem[];
  genresList?: { id: number; name: string }[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  media,
  items = [],
  genresList = [],
}) => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Consolidate hero list (prefer items array, fallback to single media)
  const heroList = useMemo(() => {
    if (items && items.length > 0) return items.slice(0, 6);
    if (media) return [media];
    return [];
  }, [items, media]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Auto-shuffle timer: cycles every 7.5s when not hovered
  useEffect(() => {
    if (heroList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % heroList.length);
    }, 7500);

    return () => clearInterval(timer);
  }, [heroList.length, isPaused]);

  const handleNext = useCallback(() => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % heroList.length);
  }, [heroList.length]);

  const handlePrev = useCallback(() => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + heroList.length) % heroList.length);
  }, [heroList.length]);

  const activeMedia = heroList[currentIndex] || heroList[0];
  if (!activeMedia) return null;

  const isMovie = 'title' in activeMedia;
  const title = isMovie ? activeMedia.title : activeMedia.name;
  const dateStr = isMovie ? activeMedia.release_date : activeMedia.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() || dateStr.slice(0, 4) : '';
  const mediaType = isMovie ? 'movie' : 'tv';
  const rating =
    typeof activeMedia.vote_average === 'number' && activeMedia.vote_average > 0
      ? activeMedia.vote_average.toFixed(1)
      : '8.5';
  const runtime =
    'runtime' in activeMedia && activeMedia.runtime
      ? `${Math.floor(activeMedia.runtime / 60)}h ${activeMedia.runtime % 60}m`
      : null;

  // Resolve genre names
  const genreNames = (() => {
    if (activeMedia.genres && activeMedia.genres.length > 0) {
      return activeMedia.genres.map((g) => g.name);
    }
    if (activeMedia.genre_ids && activeMedia.genre_ids.length > 0 && genresList.length > 0) {
      return activeMedia.genre_ids
        .map((id) => genresList.find((g) => g.id === id)?.name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 3);
    }
    return [];
  })();

  const backdropUrl = getBackdropUrl(activeMedia.backdrop_path, 'original');
  const detailsUrl = `/${mediaType}/${activeMedia.id}`;
  const watchUrl = `/watch/${mediaType}/${activeMedia.id}`;

  const heightClasses = {
    compact: 'h-[58vh] sm:h-[65vh] min-h-[460px] max-h-[700px]',
    standard: 'h-[72vh] sm:h-[82vh] min-h-[520px] max-h-[850px]',
    tall: 'h-[82vh] sm:h-[92vh] min-h-[600px] max-h-[960px]',
  }[settings.heroHeight || 'standard'];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group relative w-full ${heightClasses} overflow-hidden bg-[#07080B] select-none`}
    >
      {/* 1. CINEMATIC BACKGROUND IMAGE (TRANSITIONS WITH SMOOTH SCALE & CROSSFADE) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`hero-bg-${activeMedia.id}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 pointer-events-none"
        >
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top filter brightness-[0.72] contrast-[1.08]"
          />

          {/* Layered Glass Gradients for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-[#07080B]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080B] via-[#07080B]/85 to-transparent sm:w-3/4" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#07080B]/40 to-[#07080B]/80" />
          {/* Subtle purple atmospheric glow */}
          <div className="absolute top-1/4 left-1/6 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        </motion.div>
      </AnimatePresence>

      {/* 2. HERO CONTENT (TITLE, METADATA, ACTIONS) */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-20 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-content-${activeMedia.id}`}
            initial={{ opacity: 0, y: direction === 'next' ? 24 : -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'next' ? -20 : 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            {/* Tag & Metadata */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3 text-xs sm:text-sm">
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold tracking-wide uppercase text-[11px] backdrop-blur-md">
                Featured Spotlight
              </span>

              {settings.showRatings && (
                <span className="flex items-center gap-1 text-zinc-200 font-medium px-2 py-0.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-[var(--nova-accent)] text-[var(--nova-accent)]" />
                  <span>{rating}</span>
                </span>
              )}

              {settings.showYears && year && (
                <span className="flex items-center gap-1 text-zinc-300 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>{year}</span>
                </span>
              )}

              {runtime && (
                <span className="hidden sm:flex items-center gap-1 text-zinc-300 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>{runtime}</span>
                </span>
              )}

              <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-zinc-200 font-medium backdrop-blur-md">
                {mediaType === 'movie' ? 'Film' : 'Series'}
              </span>

              {genreNames.map((gName) => (
                <span
                  key={gName}
                  className="hidden sm:inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 border border-white/[0.08] backdrop-blur-md"
                >
                  {gName}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display mb-3 sm:mb-4 leading-tight sm:leading-none drop-shadow-lg">
              {title}
            </h1>

            {/* Overview */}
            <p className="text-zinc-300 text-xs sm:text-sm md:text-base line-clamp-3 mb-6 sm:mb-8 font-normal leading-relaxed max-w-xl drop-shadow-md">
              {activeMedia.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                data-magnetic="true"
                data-cursor="button"
                onClick={() =>
                  navigate(watchUrl, {
                    state: {
                      title,
                      overview: activeMedia.overview,
                      backdrop_path: activeMedia.backdrop_path,
                      poster_path: activeMedia.poster_path,
                    },
                  })
                }
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Now</span>
              </button>

              <button
                type="button"
                data-magnetic="true"
                data-cursor="button"
                onClick={() => navigate(detailsUrl)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#141824]/80 hover:bg-[#1E2336]/90 text-white font-semibold text-xs sm:text-sm backdrop-blur-xl border border-white/[0.14] transition-all duration-200 active:scale-95 shadow-lg"
              >
                <Info className="w-4 h-4 text-zinc-300" />
                <span>More Info</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. SHUFFLE CONTROLS & VISUAL INDICATORS */}
      {heroList.length > 1 && (
        <div className="absolute right-4 sm:right-8 lg:right-12 bottom-6 sm:bottom-10 z-20 flex items-center gap-3">
          {/* Arrow Controls */}
          <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Spotlight Title"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Spotlight Title"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dot Indicators: ● ○ ○ ○ ○ */}
          <div className="flex items-center gap-1.5 bg-black/50 px-3 py-2 rounded-full border border-white/10 backdrop-blur-md">
            {heroList.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={`hero-dot-${item.id}`}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentIndex ? 'next' : 'prev');
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full ${
                    isActive
                      ? 'w-6 h-2 bg-purple-500 shadow-sm shadow-purple-500/50'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom fade line */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#07080B] to-transparent pointer-events-none" />
    </div>
  );
};
