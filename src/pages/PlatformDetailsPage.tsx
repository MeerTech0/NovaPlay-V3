import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Film,
  Tv,
  ChevronDown,
  Search,
} from 'lucide-react';
import { getPlatformById, getPlatformMedia } from '../services/platforms';
import { MediaItem, Genre } from '../types/media';
import { MovieCard } from '../components/media/MovieCard';
import { MovieCardSkeleton } from '../components/feedback/SkeletonLoaders';
import { PlatformIcon } from '../components/media/PlatformIcon';
import { tmdbService, getBackdropUrl } from '../services/tmdb';

export const PlatformDetailsPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const platform = getPlatformById(id);

  // States
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenreId, setSelectedGenreId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'release_date'>('popularity');
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);

  // Load genres
  useEffect(() => {
    let isMounted = true;
    const loadGenres = async () => {
      try {
        const [movieG, tvG] = await Promise.all([
          tmdbService.getGenres('movie'),
          tmdbService.getGenres('tv'),
        ]);
        if (!isMounted) return;
        const map = new Map<number, Genre>();
        [...movieG, ...tvG].forEach((g) => map.set(g.id, g));
        setGenres(Array.from(map.values()));
      } catch (e) {
        // Fallback
      }
    };
    loadGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load platform media
  useEffect(() => {
    let isMounted = true;
    const fetchItems = async () => {
      if (!platform) return;
      setLoading(true);
      try {
        const items = await getPlatformMedia(platform.id, activeTab);
        if (isMounted) {
          setMediaList(items);
        }
      } catch (err) {
        console.warn('Failed to load platform media:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchItems();
    return () => {
      isMounted = false;
    };
  }, [platform, activeTab]);

  // Featured Hero Item from the platform's media
  const heroItem = useMemo(() => {
    return mediaList.length > 0 ? mediaList[0] : null;
  }, [mediaList]);

  // Filter and Sort Pipeline
  const filteredAndSortedList = useMemo(() => {
    let list = [...mediaList];

    // Filter by Tab (Movie vs TV)
    if (activeTab !== 'all') {
      list = list.filter((item) => {
        const isMovie = item.media_type === 'movie' || 'title' in item;
        return activeTab === 'movie' ? isMovie : !isMovie;
      });
    }

    // Filter by Genre
    if (selectedGenreId !== 'all') {
      const gId = parseInt(selectedGenreId, 10);
      list = list.filter((item) => {
        if (item.genre_ids?.includes(gId)) return true;
        if (item.genres?.some((g) => g.id === gId)) return true;
        return false;
      });
    }

    // Filter by In-Platform Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const title = ('title' in item ? item.title : item.name).toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        return title.includes(q) || overview.includes(q);
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      if (sortBy === 'release_date') {
        const dateA = 'release_date' in a ? a.release_date : a.first_air_date;
        const dateB = 'release_date' in b ? b.release_date : b.first_air_date;
        return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
      }
      return (b.popularity || b.vote_count || 0) - (a.popularity || a.vote_count || 0);
    });

    return list;
  }, [mediaList, activeTab, selectedGenreId, searchQuery, sortBy]);

  if (!platform) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Platform Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">The streaming network you selected does not exist or has been moved.</p>
        <button
          type="button"
          onClick={() => navigate('/platforms')}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs"
        >
          Return to Platforms
        </button>
      </div>
    );
  }

  const heroBackdrop = heroItem ? getBackdropUrl(heroItem.backdrop_path, 'original') : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#07080B] text-white pt-20 sm:pt-24 pb-20 selection:bg-purple-500/30 selection:text-purple-300"
    >
      {/* 1. PLATFORM BRAND HERO */}
      <div className="relative w-full overflow-hidden bg-[#0A0C14] border-b border-white/[0.08]">
        {/* Cinematic Backdrop if available */}
        {heroBackdrop && (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={heroBackdrop}
              alt={platform.name}
              className="w-full h-full object-cover object-top opacity-20 filter blur-xl scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-[#07080B]/80 to-transparent" />
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#07080B]/60 to-[#07080B]" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 z-10">
          {/* Breadcrumb Back */}
          <button
            type="button"
            onClick={() => navigate('/platforms')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Platforms</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div
                className="p-3 sm:p-4 rounded-3xl bg-black/60 border border-white/[0.12] shadow-2xl flex-shrink-0"
                style={{
                  boxShadow: `0 10px 30px -5px ${platform.accentColor}30`,
                }}
              >
                <PlatformIcon platformId={platform.id} size="xl" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border"
                    style={{
                      backgroundColor: `${platform.accentColor}18`,
                      borderColor: `${platform.accentColor}40`,
                      color: platform.id === 'apple-tv' ? '#FFFFFF' : platform.accentColor,
                    }}
                  >
                    {platform.badge}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                    {platform.titlesAvailable}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white">
                  {platform.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
                  {platform.category} • {platform.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SORT CONTROLS BAR (GLASS SURFACE) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1018]/90 border border-white/[0.1] backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Type Switcher (All, Movies, TV) */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('movie')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'movie'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tv')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tv'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Series</span>
            </button>
          </div>

          {/* Right: Search, Genre Dropdown & Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search filter within platform */}
            <div className="relative min-w-[160px] sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search platform..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 text-xs text-white border border-white/[0.08] focus:border-purple-500/60 focus:outline-none"
              />
            </div>

            {/* Genre Dropdown */}
            <div className="relative">
              <select
                value={selectedGenreId}
                onChange={(e) => setSelectedGenreId(e.target.value)}
                className="appearance-none bg-black/40 text-zinc-200 border border-white/[0.08] pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="all">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-black/40 text-zinc-200 border border-white/[0.08] pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="popularity">Popularity</option>
                <option value="rating">Top Rated</option>
                <option value="release_date">Newest</option>
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MEDIA RESULTS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
          <span>
            SHOWING <strong className="text-white">{filteredAndSortedList.length}</strong> TITLES ON {platform.name.toUpperCase()}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <MovieCardSkeleton key={`plat-skel-${i}`} />
            ))}
          </div>
        ) : filteredAndSortedList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredAndSortedList.map((item) => (
              <MovieCard key={`plat-item-${item.id}`} media={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-base font-bold text-white mb-1">No titles found</p>
            <p className="text-xs text-zinc-400">
              Try resetting your genre filter or search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGenreId('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
