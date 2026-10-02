import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Info,
  Sparkles,
  Server,
  Globe,
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  Code2,
  Share2,
  Plus,
  Play,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { tmdbService, getBackdropUrl, getPosterUrl } from '../services/tmdb';
import { MediaDetails, MediaItem } from '../types/media';
import {
  videoProvider,
  VideoSource,
  SubtitleTrack,
  AudioTrackOption,
  TVSeason,
  TVEpisode,
  getBingrEmbedUrl,
  getScreenscapeEmbedUrl,
  STREAM_SERVERS,
  STREAM_LANGUAGES,
} from '../services/videoProvider';
import {
  saveContinueWatching,
  getContinueWatchingItem,
  getContinueWatchingList,
  ContinueWatchingItem,
} from '../services/continueWatching';
import { isInMyList, toggleMyList, MY_LIST_UPDATED_EVENT } from '../services/myList';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { MovieCard } from '../components/media/MovieCard';
import { EpisodeListSection } from '../components/media/EpisodeListSection';

export const WatchPage: React.FC = () => {
  const { type = 'movie', id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const passedState = (location.state as any) || {};

  const isTV = type === 'tv';

  const paramSeason = searchParams.get('s');
  const paramEpisode = searchParams.get('e');
  const paramTime = searchParams.get('t');

  // Load existing continue watching entry if available
  const existingCwItem = useMemo(() => {
    if (!id || !type) return null;
    return getContinueWatchingItem(id, type);
  }, [id, type]);

  // Initial playback position from URL param or saved continue watching item
  const initialPosition = useMemo(() => {
    if (paramTime) {
      const parsed = parseInt(paramTime, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (existingCwItem && existingCwItem.currentPlaybackPosition > 0) {
      return existingCwItem.currentPlaybackPosition;
    }
    return 0;
  }, [paramTime, existingCwItem]);

  const [_playbackPos, setPlaybackPos] = useState<number>(initialPosition);

  const [details, setDetails] = useState<MediaDetails | null>(() => {
    if (passedState.title) {
      return {
        id: Number(id) || 1,
        title: passedState.title,
        overview: passedState.overview || '',
        backdrop_path: passedState.backdrop_path || null,
        poster_path: passedState.poster_path || null,
        media_type: type,
      } as MediaDetails;
    }
    return null;
  });
  const [_loading, setLoading] = useState(!details);
  const [_error, setError] = useState<string | null>(null);

  // Streaming Server selection (Default to Bingr as requested)
  const [selectedServer, setSelectedServer] = useState<'bingr' | 'screenscape' | 'screenscape-primary' | 'screenscape-flix' | 'native'>('bingr');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showEmbedDetails, setShowEmbedDetails] = useState(false);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);

  // My List state
  const [inList, setInList] = useState(false);

  // Global continue watching list for the sidebar
  const [otherCwList, setOtherCwList] = useState<ContinueWatchingItem[]>([]);

  // Video playback data resolved via provider abstraction
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);

  // TV Shows: Seasons & Episodes state
  const [seasons, setSeasons] = useState<TVSeason[]>(() => {
    return isTV ? videoProvider.generateTVSeasons(3, passedState.title || `Series #${id}`) : [];
  });
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(() => {
    if (paramSeason) {
      const parsed = parseInt(paramSeason, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (existingCwItem?.seasonNumber) return existingCwItem.seasonNumber;
    return 1;
  });
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number>(() => {
    if (paramEpisode) {
      const parsed = parseInt(paramEpisode, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (existingCwItem?.episodeNumber) return existingCwItem.episodeNumber;
    return 1;
  });

  // Autoplay setting (from localStorage, default false unless enabled)
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    try {
      return localStorage.getItem('novaplay_autoplay_next') === 'true';
    } catch {
      return false;
    }
  });

  // Track episode watch progress in localStorage
  const [episodeProgressMap, setEpisodeProgressMap] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('novaplay_episode_progress') || '{}');
    } catch {
      return {};
    }
  });

  // Check My List status
  useEffect(() => {
    if (!id || !type) return;
    const updateListStatus = () => {
      setInList(isInMyList(id, type));
    };
    updateListStatus();
    window.addEventListener(MY_LIST_UPDATED_EVENT, updateListStatus);
    window.addEventListener('storage', updateListStatus);
    return () => {
      window.removeEventListener(MY_LIST_UPDATED_EVENT, updateListStatus);
      window.removeEventListener('storage', updateListStatus);
    };
  }, [id, type]);

  // Load other continue watching items for sidebar
  useEffect(() => {
    const all = getContinueWatchingList();
    const filtered = all.filter((item) => String(item.id) !== String(id)).slice(0, 4);
    setOtherCwList(filtered);
  }, [id]);

  // Toggle Autoplay
  const handleToggleAutoplay = () => {
    const nextVal = !autoPlayNext;
    setAutoPlayNext(nextVal);
    try {
      localStorage.setItem('novaplay_autoplay_next', String(nextVal));
    } catch {
      // Ignore
    }
  };

  // Load Title Metadata
  useEffect(() => {
    let isMounted = true;
    const fetchMedia = async () => {
      if (!id || !type) return;
      setError(null);
      try {
        const data = await tmdbService.getDetails(id, type);
        if (!isMounted) return;
        setDetails(data);

        if (type === 'tv') {
          const generatedSeasons = videoProvider.generateTVSeasons(
            data.number_of_seasons || 3,
            data.title
          );
          setSeasons(generatedSeasons);
        }
      } catch (err: any) {
        console.warn('Metadata fetch warning for watch stage:', err);
        if (!isMounted) return;
        if (!details) {
          setDetails({
            id: Number(id) || 1,
            title: isTV ? `TV Series #${id}` : `Movie #${id}`,
            overview: 'Now streaming in high definition. Enjoy the presentation.',
            media_type: type,
          } as MediaDetails);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();
    return () => {
      isMounted = false;
    };
  }, [id, type]);

  // Resolve Video Sources, Subtitles, and Audio Tracks from provider abstraction
  useEffect(() => {
    const resolveMediaStreams = async () => {
      if (!id || !type) return;
      try {
        const [resolvedSources, resolvedSubs, resolvedAuds] = await Promise.all([
          videoProvider.resolveSources(id, type, selectedSeasonNumber, selectedEpisodeNumber),
          videoProvider.resolveSubtitles(id, type),
          videoProvider.resolveAudioTracks(id, type),
        ]);

        setSources(resolvedSources);
        setSubtitles(resolvedSubs);
        setAudioTracks(resolvedAuds);
      } catch (err) {
        console.error('Failed to resolve streams from video provider:', err);
      }
    };

    resolveMediaStreams();
  }, [id, type, selectedSeasonNumber, selectedEpisodeNumber]);

  // Current Season and Episodes list
  const currentSeason = useMemo(() => {
    return seasons.find((s) => s.seasonNumber === selectedSeasonNumber) || seasons[0];
  }, [seasons, selectedSeasonNumber]);

  const currentEpisode: TVEpisode | undefined = useMemo(() => {
    if (!currentSeason) return undefined;
    return (
      currentSeason.episodes.find((e) => e.episodeNumber === selectedEpisodeNumber) ||
      currentSeason.episodes[0]
    );
  }, [currentSeason, selectedEpisodeNumber]);

  // Previous & Next Episode Navigation
  const hasPreviousEpisode = isTV && (selectedEpisodeNumber > 1 || selectedSeasonNumber > 1);
  const hasNextEpisode =
    isTV &&
    Boolean(
      currentSeason &&
        (selectedEpisodeNumber < currentSeason.episodes.length ||
          selectedSeasonNumber < seasons.length)
    );

  const nextEpisodeInfo = useMemo(() => {
    if (!isTV || !currentSeason) return null;
    const nextInSeason = currentSeason.episodes.find(
      (e) => e.episodeNumber === selectedEpisodeNumber + 1
    );
    if (nextInSeason) {
      return {
        seasonNumber: selectedSeasonNumber,
        episode: nextInSeason,
      };
    }
    const nextSeason = seasons.find((s) => s.seasonNumber === selectedSeasonNumber + 1);
    if (nextSeason && nextSeason.episodes.length > 0) {
      return {
        seasonNumber: selectedSeasonNumber + 1,
        episode: nextSeason.episodes[0],
      };
    }
    return null;
  }, [isTV, currentSeason, seasons, selectedEpisodeNumber, selectedSeasonNumber]);

  const handlePreviousEpisode = () => {
    if (!hasPreviousEpisode || !currentSeason) return;
    if (selectedEpisodeNumber > 1) {
      setSelectedEpisodeNumber((prev) => prev - 1);
    } else if (selectedSeasonNumber > 1) {
      const prevSeasonNumber = selectedSeasonNumber - 1;
      const prevSeason = seasons.find((s) => s.seasonNumber === prevSeasonNumber);
      if (prevSeason && prevSeason.episodes.length > 0) {
        setSelectedSeasonNumber(prevSeasonNumber);
        setSelectedEpisodeNumber(prevSeason.episodes.length);
      }
    }
  };

  const handleNextEpisode = () => {
    if (!hasNextEpisode || !currentSeason) return;
    if (selectedEpisodeNumber < currentSeason.episodes.length) {
      setSelectedEpisodeNumber((prev) => prev + 1);
    } else if (selectedSeasonNumber < seasons.length) {
      setSelectedSeasonNumber((prev) => prev + 1);
      setSelectedEpisodeNumber(1);
    }
  };

  const handleEpisodeEnded = () => {
    if (isTV && currentEpisode) {
      const key = `${id}-s${selectedSeasonNumber}-e${selectedEpisodeNumber}`;
      const updated = { ...episodeProgressMap, [key]: 100 };
      setEpisodeProgressMap(updated);
      try {
        localStorage.setItem('novaplay_episode_progress', JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }

    const totalDur = details?.runtime ? details.runtime * 60 : (isTV ? 2700 : 6000);
    saveContinueWatching({
      id: id || '1',
      mediaType: type,
      title: details?.title || 'Streaming Title',
      poster: details?.poster_path ? getPosterUrl(details.poster_path, 'w500') : (passedState.poster_path || null),
      backdrop: details?.backdrop_path ? getBackdropUrl(details.backdrop_path, 'original') : null,
      seasonNumber: isTV ? selectedSeasonNumber : undefined,
      episodeNumber: isTV ? selectedEpisodeNumber : undefined,
      episodeTitle: isTV ? (currentEpisode?.title || `Episode ${selectedEpisodeNumber}`) : undefined,
      currentPlaybackPosition: totalDur,
      totalDuration: totalDur,
    });

    if (autoPlayNext && hasNextEpisode) {
      handleNextEpisode();
    }
  };

  // Toggle My List
  const handleToggleMyList = () => {
    if (!details) return;
    const isAdded = toggleMyList({
      id: details.id,
      mediaType: type,
      title: details.title || (details as any).name || 'Title',
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      vote_average: details.vote_average || 0,
      release_date: details.release_date,
      first_air_date: (details as any).first_air_date,
      overview: details.overview,
    });
    setInList(isAdded);
  };

  // Share link
  const handleShare = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      // Ignore
    }
  };

  // Title, dates, genres & runtime derivations
  const title = details?.title || (details as any)?.name || passedState.title || (isTV ? 'TV Series' : 'Movie');
  const overview = details?.overview || passedState.overview || 'Now playing in premium high definition.';
  const dateStr = details?.release_date || (details as any)?.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() || dateStr.slice(0, 4) : '';
  const runtime = details?.runtime && details.runtime > 0 ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : null;
  const genreNames = details?.genres?.map((g) => g.name).slice(0, 3).join(' • ');

  const backdropUrl = getBackdropUrl(details?.backdrop_path || passedState.backdrop_path, 'original');
  const detailsUrl = `/${type}/${id}`;

  const currentEpisodeSubtitle = isTV && currentEpisode
    ? `S${selectedSeasonNumber} E${selectedEpisodeNumber}: ${currentEpisode.title}`
    : undefined;

  // Active Embed URL (Bingr as Primary Main Provider, ScreenScape as mirrors)
  const activeEmbedUrl = useMemo(() => {
    if (!id) return '';
    if (selectedServer === 'bingr') {
      return getBingrEmbedUrl(
        id,
        type,
        selectedSeasonNumber,
        selectedEpisodeNumber
      );
    }
    const hostMap: Record<string, 'nxsha' | 'primary' | 'flix'> = {
      'screenscape': 'nxsha',
      'screenscape-primary': 'primary',
      'screenscape-flix': 'flix',
    };
    const host = hostMap[selectedServer] || 'nxsha';
    return getScreenscapeEmbedUrl(
      id,
      type,
      selectedSeasonNumber,
      selectedEpisodeNumber,
      selectedLanguage,
      host,
      initialPosition
    );
  }, [id, type, selectedSeasonNumber, selectedEpisodeNumber, selectedLanguage, selectedServer, initialPosition]);

  const htmlEmbedCode = useMemo(() => {
    return `<iframe src="${activeEmbedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }, [activeEmbedUrl]);

  // Sync Bingr real-time player status for Continue Watching
  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (data?.type === 'PLAYER_EVENT' && data?.data?.event === 'playerstatus') {
          const { currentTime, duration } = data.data;
          if (typeof currentTime === 'number' && typeof duration === 'number' && duration > 0) {
            setPlaybackPos(currentTime);
            if (details) {
              const mediaTitle = details.title || (details as any).name || 'Streaming Media';
              const resolvedPoster = details.poster_path
                ? getPosterUrl(details.poster_path, 'w500')
                : (passedState.poster_path || null);
              saveContinueWatching({
                id: details.id,
                mediaType: type,
                title: mediaTitle,
                poster: resolvedPoster,
                backdrop: backdropUrl || null,
                seasonNumber: isTV ? selectedSeasonNumber : undefined,
                episodeNumber: isTV ? selectedEpisodeNumber : undefined,
                episodeTitle: isTV ? (currentEpisode?.title || `Episode ${selectedEpisodeNumber}`) : undefined,
                currentPlaybackPosition: currentTime,
                totalDuration: duration,
              });
            }
          }
        }
      } catch (err) {
        // Ignore postMessage parsing errors
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [details, type, isTV, selectedSeasonNumber, selectedEpisodeNumber, currentEpisode, backdropUrl, passedState]);

  const handleCopyDirect = () => {
    if (!activeEmbedUrl) return;
    navigator.clipboard.writeText(activeEmbedUrl);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2000);
  };

  const handleCopyEmbed = () => {
    if (!htmlEmbedCode) return;
    navigator.clipboard.writeText(htmlEmbedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  // Related Content
  const relatedTitles: MediaItem[] = [
    ...(details?.recommendations?.results || []),
    ...(details?.similar?.results || []),
  ].slice(0, 6);

  return (
    <div className="relative min-h-screen bg-[#07080B] text-white pt-20 sm:pt-24 pb-20 overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-300">
      {/* 8. WATCH PAGE BACKGROUND (CINEMATIC BACKDROP WITH HEAVY BLUR & LOW OPACITY) */}
      {backdropUrl && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover object-top opacity-15 filter blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-[#07080B]/85 bg-gradient-to-t from-[#07080B] via-[#07080B]/90 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ------------------------------------------------ */}
        {/* BACK / BREADCRUMB                                */}
        {/* ------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <button
              type="button"
              onClick={() => navigate(detailsUrl)}
              data-cursor="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Details</span>
            </button>
            <span className="text-zinc-600">/</span>
            <button
              type="button"
              onClick={() => navigate(isTV ? '/tv' : '/movies')}
              className="hover:text-white transition-colors"
            >
              {isTV ? 'TV Series' : 'Movies'}
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200 truncate max-w-[200px] sm:max-w-xs">{title}</span>
          </div>

          {/* Autoplay Next Toggle (for TV Shows) */}
          {isTV && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-white/[0.06]">
              <span className="text-xs text-zinc-400">Autoplay Next:</span>
              <button
                type="button"
                onClick={handleToggleAutoplay}
                data-cursor="button"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                title={autoPlayNext ? 'Autoplay enabled' : 'Autoplay disabled'}
              >
                {autoPlayNext ? (
                  <ToggleRight className="w-6 h-6 text-purple-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-zinc-600" />
                )}
                <span className={autoPlayNext ? 'text-purple-300' : 'text-zinc-500'}>
                  {autoPlayNext ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------ */}
        {/* MOVIE / SERIES TITLE & METADATA ABOVE PLAYER     */}
        {/* ------------------------------------------------ */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-semibold uppercase">
              {isTV ? 'Episodic Series' : 'Feature Film'}
            </span>

            {isTV && currentEpisode && (
              <span className="font-semibold text-white">
                Season {selectedSeasonNumber} • Episode {selectedEpisodeNumber}
              </span>
            )}

            {year && <span>• {year}</span>}
            {genreNames && <span className="hidden sm:inline">• {genreNames}</span>}
            {runtime && <span>• {runtime}</span>}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight">
            {title}
          </h1>

          {isTV && currentEpisode && (
            <p className="text-sm sm:text-base text-zinc-300 font-medium">
              {currentEpisode.title}
            </p>
          )}
        </div>

        {/* ------------------------------------------------ */}
        {/* STREAM SERVER SELECTOR & AUDIO CONTROLS          */}
        {/* ------------------------------------------------ */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0E1018]/85 border border-white/[0.08] backdrop-blur-xl shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 pl-1 font-mono">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Provider:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {STREAM_SERVERS.map((server) => {
                const isActive = selectedServer === server.id;
                return (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => setSelectedServer(server.id)}
                    data-cursor="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white font-semibold shadow-md'
                        : 'bg-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/[0.1] border border-white/[0.06]'
                    }`}
                  >
                    <span>{server.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive ? 'bg-black/25 text-white' : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      {server.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions (Reload, Fullscreen Tab, Embed Code Toggle) */}
          <div className="flex items-center gap-2">
            {selectedServer.startsWith('screenscape') && (
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400 hidden sm:inline">Audio:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-transparent text-xs text-white border-0 focus:ring-0 focus:outline-none cursor-pointer pr-1"
                >
                  {STREAM_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#111319] text-white">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedServer !== 'native' && (
              <>
                <button
                  type="button"
                  onClick={() => setIframeReloadKey((k) => k + 1)}
                  data-cursor="button"
                  title="Reload Player Stream"
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.06] transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <a
                  href={activeEmbedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="hover"
                  title="Open in Fullscreen Tab"
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.06] transition-colors inline-flex items-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* EXISTING PLAYER CONTAINER (LOCKED — UNTOUCHED)   */}
        {/* ------------------------------------------------ */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-white/[0.12] shadow-2xl glass-panel-elevated">
          {selectedServer === 'native' ? (
            <VideoPlayer
              sources={sources}
              subtitles={subtitles}
              audioTracks={audioTracks}
              poster={backdropUrl}
              title={title}
              subtitle={currentEpisodeSubtitle}
              onNextEpisode={handleNextEpisode}
              onPreviousEpisode={handlePreviousEpisode}
              hasNextEpisode={hasNextEpisode}
              hasPreviousEpisode={hasPreviousEpisode}
              onEnded={handleEpisodeEnded}
              autoPlayNext={autoPlayNext}
            />
          ) : (
            <div className="relative w-full aspect-video bg-black">
              <iframe
                key={`${activeEmbedUrl}-${iframeReloadKey}`}
                src={activeEmbedUrl}
                title={`${title} - ${currentEpisodeSubtitle || 'Player'}`}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* 11. VIDEO PROVIDER DISCLAIMER */}
        <div className="px-1 text-[11px] sm:text-xs text-zinc-400 flex items-start sm:items-center gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Video playback is provided through the selected video provider. NovaPlay does not host or control third-party video content.
          </span>
        </div>

        {/* ------------------------------------------------ */}
        {/* BELOW THE PLAYER: TITLE, DESCRIPTION, ACTIONS    */}
        {/* ------------------------------------------------ */}
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0E1018]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
              {isTV && currentEpisode ? currentEpisode.overview : overview}
            </p>
          </div>

          {/* Action Buttons: [+ My List], [Share], [More Info] */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleToggleMyList}
              data-cursor="button"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
                inList
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10'
              }`}
            >
              {inList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{inList ? 'In My List' : '+ My List'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              data-cursor="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-all"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedShare ? 'Copied Link' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(detailsUrl)}
              data-cursor="button"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              <span>More Info</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmbedDetails((prev) => !prev)}
              data-cursor="button"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-mono border border-white/[0.06] transition-all"
              title="View Direct Embed Code"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Direct URL & HTML Embed Snippets */}
        <AnimatePresence>
          {showEmbedDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
            >
              {/* Direct URL Box */}
              <div className="p-4 rounded-2xl bg-[#0E1018] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-zinc-300">DIRECT STREAM URL</span>
                  <button
                    type="button"
                    onClick={handleCopyDirect}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 text-white text-xs font-semibold"
                  >
                    {copiedDirect ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDirect ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-zinc-400 truncate bg-black/50 p-2.5 rounded-xl border border-white/[0.04] select-all">
                  {activeEmbedUrl}
                </p>
              </div>

              {/* HTML Embed Box */}
              <div className="p-4 rounded-2xl bg-[#0E1018] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-zinc-300">HTML EMBED SNIPPET</span>
                  <button
                    type="button"
                    onClick={handleCopyEmbed}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                  >
                    {copiedEmbed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmbed ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-zinc-400 truncate bg-black/50 p-2.5 rounded-xl border border-white/[0.04] select-all">
                  {htmlEmbedCode}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------ */}
        {/* 10. WATCH PAGE MAIN CONTENT + SIDEBAR LAYOUT     */}
        {/* ------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Main Column (8 Cols on Desktop): EPISODES & DETAILS */}
          <div className="lg:col-span-8 space-y-8">
            {/* 9. PREMIUM EPISODE EXPERIENCE (FOR TV SHOWS) */}
            {isTV && seasons.length > 0 && (
              <div className="rounded-3xl bg-[#0E1018]/70 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 shadow-xl">
                <EpisodeListSection
                  showId={id || 1}
                  seasons={seasons}
                  selectedSeasonNumber={selectedSeasonNumber}
                  selectedEpisodeNumber={selectedEpisodeNumber}
                  onSelectSeason={(seasonNum) => {
                    setSelectedSeasonNumber(seasonNum);
                    setSelectedEpisodeNumber(1);
                  }}
                  onSelectEpisode={(epNum) => {
                    setSelectedEpisodeNumber(epNum);
                  }}
                  episodeProgressMap={episodeProgressMap}
                  fallbackBackdropPath={details?.backdrop_path}
                  fallbackPosterPath={details?.poster_path}
                />
              </div>
            )}

            {/* MORE LIKE THIS / SIMILAR CONTENT (GRID) */}
            {relatedTitles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>More Like This</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {relatedTitles.slice(0, 6).map((item) => (
                    <MovieCard key={`more-${item.id}`} media={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 10. PREMIUM GLASS SIDEBAR (4 Cols on Desktop, Collapses Below on Mobile) */}
          <div className="lg:col-span-4 space-y-6">
            {/* NEXT EPISODE QUICK JUMP CARD */}
            {isTV && nextEpisodeInfo && (
              <div className="p-5 rounded-2xl bg-[#0E1018]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Up Next</span>
                  </span>
                  <span>S{nextEpisodeInfo.seasonNumber} • E{nextEpisodeInfo.episode.episodeNumber}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {nextEpisodeInfo.episode.title}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {nextEpisodeInfo.episode.overview}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeasonNumber(nextEpisodeInfo.seasonNumber);
                    setSelectedEpisodeNumber(nextEpisodeInfo.episode.episodeNumber);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Next Episode</span>
                </button>
              </div>
            )}

            {/* CONTINUE WATCHING SIDEBAR CARD */}
            {otherCwList.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0E1018]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold border-b border-white/[0.06] pb-2">
                  <span>Continue Watching</span>
                  <span className="text-[11px] text-zinc-500">{otherCwList.length} titles</span>
                </div>

                <div className="space-y-2.5">
                  {otherCwList.map((cw) => (
                    <div
                      key={`cw-side-${cw.id}-${cw.mediaType}`}
                      onClick={() => navigate(`/watch/${cw.mediaType}/${cw.id}`)}
                      className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-14 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/10">
                          {cw.poster && (
                            <img src={cw.poster} alt={cw.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            {cw.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {cw.mediaType === 'tv'
                              ? `S${cw.seasonNumber || 1} E${cw.episodeNumber || 1}`
                              : 'Feature Film'}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STREAMING ENGINES INFO CARD */}
            <div className="p-5 rounded-2xl bg-[#0E1018]/60 border border-white/[0.06] backdrop-blur-md space-y-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2 font-semibold text-white font-mono uppercase text-[11px]">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Multi-Server Cinema Pipeline</span>
              </div>
              <p className="leading-relaxed">
                Stream in full 4K UHD with active server failover. NovaPlay dynamically resolves content across Bingr, ScreenScape, and custom HLS endpoints with no regional blocks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
