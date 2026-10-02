import { MediaItem } from '../types/media';
import { isTMDBConfigured, tmdbService } from './tmdb';
import {
  PLACEHOLDER_POPULAR_MOVIES,
  PLACEHOLDER_TOP_RATED,
  PLACEHOLDER_UPCOMING_MOVIES,
  PLACEHOLDER_POPULAR_TV,
  PLACEHOLDER_UPCOMING_TV,
  PLACEHOLDER_EXTENDED_MOVIES,
  PLACEHOLDER_EXTENDED_TV,
} from '../data/placeholderData';

export interface Platform {
  id: string;
  name: string;
  slug: string;
  tmdbProviderId: number;
  badge: string;
  category: string;
  description: string;
  accentColor: string;
  accentBorder: string;
  gradientBg: string;
  titlesAvailable: string;
  flagshipTitles: string[];
}

export const PLATFORMS: Platform[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    slug: 'netflix',
    tmdbProviderId: 8,
    badge: 'Global Leader',
    category: 'Originals & Worldwide Sensation',
    description: 'Iconic original series, global phenomena, Oscar-winning cinema, and binge-worthy docuseries.',
    accentColor: '#E50914',
    accentBorder: 'rgba(229, 9, 20, 0.45)',
    gradientBg: 'from-red-600/20 via-zinc-900/40 to-transparent',
    titlesAvailable: '3,800+ Titles',
    flagshipTitles: ['Stranger Things', 'Squid Game', 'Dark', 'Wednesday', 'Red Notice', 'The Witcher'],
  },
  {
    id: 'apple-tv',
    name: 'Apple TV+',
    slug: 'apple-tv',
    tmdbProviderId: 350,
    badge: 'Prestige Cinema',
    category: 'Emmy & Academy Award Winners',
    description: 'Star-studded dramas, visionary sci-fi spectacles, groundbreaking comedies, and auteur filmmaking.',
    accentColor: '#F5F5F7',
    accentBorder: 'rgba(245, 245, 247, 0.4)',
    gradientBg: 'from-zinc-400/20 via-zinc-800/40 to-transparent',
    titlesAvailable: '250+ Exclusives',
    flagshipTitles: ['Severance', 'Ted Lasso', 'Killers of the Flower Moon', 'Foundation', 'Silo', 'The Morning Show'],
  },
  {
    id: 'max',
    name: 'Max',
    slug: 'max',
    tmdbProviderId: 1899,
    badge: 'Iconic HBO',
    category: 'HBO Originals & DC Universe',
    description: 'The premier destination for HBO masterpieces, Warner Bros. blockbusters, and the DC Universe.',
    accentColor: '#9933FF',
    accentBorder: 'rgba(153, 51, 255, 0.45)',
    gradientBg: 'from-purple-600/25 via-indigo-950/40 to-transparent',
    titlesAvailable: '2,900+ Titles',
    flagshipTitles: ['House of the Dragon', 'The Last of Us', 'The Batman', 'Succession', 'Dune: Part Two', 'Game of Thrones'],
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    slug: 'disney-plus',
    tmdbProviderId: 337,
    badge: 'Epic Franchises',
    category: 'Marvel, Star Wars & Pixar',
    description: 'The monumental home of Marvel Studios, Star Wars galaxy, Pixar animation, and National Geographic.',
    accentColor: '#0063E5',
    accentBorder: 'rgba(0, 99, 229, 0.45)',
    gradientBg: 'from-blue-600/25 via-blue-950/40 to-transparent',
    titlesAvailable: '2,400+ Titles',
    flagshipTitles: ['Loki', 'The Mandalorian', 'Andor', 'Avengers: Endgame', 'Moana', 'WandaVision'],
  },
  {
    id: 'prime-video',
    name: 'Prime Video',
    slug: 'prime-video',
    tmdbProviderId: 9,
    badge: 'Prime Originals',
    category: 'Action Sagas & Global Epics',
    description: 'Unfiltered action sagas, epic fantasy world-building, and premium streaming exclusives.',
    accentColor: '#00A8E1',
    accentBorder: 'rgba(0, 168, 225, 0.45)',
    gradientBg: 'from-cyan-600/25 via-sky-950/40 to-transparent',
    titlesAvailable: '4,500+ Titles',
    flagshipTitles: ['The Boys', 'Fallout', 'The Rings of Power', 'Reacher', 'Invincible', 'The Wheel of Time'],
  },
  {
    id: 'hulu',
    name: 'Hulu',
    slug: 'hulu',
    tmdbProviderId: 15,
    badge: 'Critically Acclaimed',
    category: 'Award-Winning TV & FX Shows',
    description: 'Top-tier prestige television, FX cultural sensations, next-day broadcast hits, and original movies.',
    accentColor: '#1CE783',
    accentBorder: 'rgba(28, 231, 131, 0.45)',
    gradientBg: 'from-emerald-500/25 via-teal-950/40 to-transparent',
    titlesAvailable: '2,100+ Titles',
    flagshipTitles: ['Shōgun', 'The Bear', 'Only Murders in the Building', 'Fargo', 'The Handmaid\'s Tale'],
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+',
    slug: 'paramount-plus',
    tmdbProviderId: 531,
    badge: 'Mountain of Entertainment',
    category: 'Star Trek, Yellowstone & CBS',
    description: 'Expansive universes from Taylor Sheridan, Star Trek saga, theatrical releases, and live sports.',
    accentColor: '#0064FF',
    accentBorder: 'rgba(0, 100, 255, 0.45)',
    gradientBg: 'from-blue-500/25 via-indigo-950/40 to-transparent',
    titlesAvailable: '1,800+ Titles',
    flagshipTitles: ['Yellowstone', 'Top Gun: Maverick', 'Halo', '1883', 'Star Trek: Strange New Worlds'],
  },
  {
    id: 'peacock',
    name: 'Peacock',
    slug: 'peacock',
    tmdbProviderId: 387,
    badge: 'Universal & NBC',
    category: 'Blockbusters & NBC Classics',
    description: 'Universal theatrical releases fresh from cinemas, NBC iconic comedies, and binge-worthy originals.',
    accentColor: '#F59E0B',
    accentBorder: 'rgba(245, 158, 11, 0.45)',
    gradientBg: 'from-amber-500/25 via-orange-950/40 to-transparent',
    titlesAvailable: '1,500+ Titles',
    flagshipTitles: ['Oppenheimer', 'The Office', 'Poker Face', 'Ted', 'Five Nights at Freddy\'s'],
  },
];

export function getPlatformById(idOrSlug: string): Platform | undefined {
  const normalized = idOrSlug.toLowerCase().trim();
  return PLATFORMS.find((p) => p.id === normalized || p.slug === normalized);
}

// Master pool of media for curated offline fallback
const MASTER_POOL: MediaItem[] = [
  ...PLACEHOLDER_POPULAR_MOVIES,
  ...PLACEHOLDER_POPULAR_TV,
  ...PLACEHOLDER_TOP_RATED,
  ...PLACEHOLDER_UPCOMING_MOVIES,
  ...PLACEHOLDER_UPCOMING_TV,
  ...PLACEHOLDER_EXTENDED_MOVIES,
  ...PLACEHOLDER_EXTENDED_TV,
];

/**
 * Curated platform title associations from the existing high-quality dataset
 */
const PLATFORM_TITLE_KEYWORDS: Record<string, string[]> = {
  netflix: ['squid game', 'dark', 'stranger things', 'arcane', 'blade runner', 'cyberpunk', 'glass onion'],
  'apple-tv': ['severance', 'interstellar', 'killers of the flower moon', 'oppenheimer', 'napoleon'],
  max: ['dune', 'batman', 'game of thrones', 'house of the dragon', 'the last of us', 'succession', 'se7en', 'dark knight'],
  'disney-plus': ['star wars', 'avengers', 'dune', 'marvel', 'loki', 'mandalorian', 'animation'],
  'prime-video': ['boys', 'fallout', 'reacher', 'rings of power', 'shutter island', 'invincible'],
  hulu: ['shōgun', 'bear', 'only murders', 'fargo', 'anatomy of a fall', 'poor things'],
  'paramount-plus': ['yellowstone', 'top gun', 'halo', 'interstellar', 'star trek', 'mission'],
  peacock: ['oppenheimer', 'office', 'poker face', 'ted', 'past lives'],
};

/**
 * Fetch media items for a specific platform.
 * Supports live TMDB discover query with fallback to curated platform pool.
 */
export async function getPlatformMedia(
  platformId: string,
  mediaType: 'all' | 'movie' | 'tv' = 'all'
): Promise<MediaItem[]> {
  const platform = getPlatformById(platformId);
  if (!platform) return [];

  // Try live TMDB Discover with with_watch_providers if configured
  try {
    if (isTMDBConfigured) {
      const results = await tmdbService.discoverMedia({
        mediaType: mediaType === 'all' ? undefined : mediaType,
        sortBy: 'popularity.desc',
      });
      if (results && results.length > 0) {
        return results;
      }
    }
  } catch (err) {
    // Fall back to curated dataset gracefully
  }

  // Filter master pool by platform flagship associations and keywords
  const keywords = PLATFORM_TITLE_KEYWORDS[platform.id] || [];
  const matched: MediaItem[] = [];
  const seenIds = new Set<number>();

  MASTER_POOL.forEach((item) => {
    if (seenIds.has(item.id)) return;
    const isMovie = item.media_type === 'movie' || 'title' in item;
    if (mediaType === 'movie' && !isMovie) return;
    if (mediaType === 'tv' && isMovie) return;

    const titleLower = ('title' in item ? item.title : item.name).toLowerCase();
    const overviewLower = (item.overview || '').toLowerCase();

    const matchesKeyword = keywords.some(
      (kw) => titleLower.includes(kw) || overviewLower.includes(kw)
    );

    if (matchesKeyword) {
      seenIds.add(item.id);
      matched.push(item);
    }
  });

  // Supplement if matched is less than 12
  if (matched.length < 12) {
    MASTER_POOL.forEach((item) => {
      if (matched.length >= 16) return;
      if (seenIds.has(item.id)) return;
      const isMovie = item.media_type === 'movie' || 'title' in item;
      if (mediaType === 'movie' && !isMovie) return;
      if (mediaType === 'tv' && isMovie) return;

      seenIds.add(item.id);
      matched.push(item);
    });
  }

  return matched;
}
