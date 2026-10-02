import React from 'react';

interface PlatformIconProps {
  platformId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platformId,
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  switch (platformId.toLowerCase()) {
    case 'netflix':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Netflix"
        >
          <rect width="100" height="100" rx="22" fill="#0C0D12" />
          <path
            d="M30 18H40V82H30V18Z"
            fill="#B81D24"
          />
          <path
            d="M60 18H70V82H60V18Z"
            fill="#B81D24"
          />
          <path
            d="M30 18H41.5L70 82H58.5L30 18Z"
            fill="#E50914"
            style={{ filter: 'drop-shadow(0px 2px 8px rgba(229, 9, 20, 0.4))' }}
          />
        </svg>
      );

    case 'apple-tv':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Apple TV+"
        >
          <rect width="100" height="100" rx="22" fill="#14151C" />
          {/* Apple Logo Silhouette */}
          <path
            d="M44.5 48.2C44.4 42.6 48.9 39.8 49.1 39.6C46.5 35.8 42.5 35.3 41.2 35.2C37.8 34.8 34.5 37.2 32.8 37.2C31 37.2 28.4 35.3 25.7 35.3C22.2 35.3 19 37.3 17.2 40.5C13.5 46.9 16.3 56.4 19.8 61.5C21.6 64 23.6 66.8 26.3 66.7C28.9 66.6 30 65 33.1 65C36.1 65 37.1 66.7 39.8 66.6C42.7 66.5 44.5 64 46.2 61.5C48.2 58.6 49 55.8 49.1 55.7C48.9 55.6 44.6 53.9 44.5 48.2Z"
            fill="#F5F5F7"
          />
          <path
            d="M38.5 32.3C39.9 30.5 40.9 28 40.6 25.5C38.4 25.6 35.7 27 34.2 28.8C32.9 30.3 31.8 32.9 32.1 35.3C34.5 35.5 37.1 34 38.5 32.3Z"
            fill="#F5F5F7"
          />
          {/* TV+ Text */}
          <text
            x="54"
            y="56"
            fill="#FFFFFF"
            fontSize="22"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            tv+
          </text>
        </svg>
      );

    case 'max':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Max"
        >
          <rect width="100" height="100" rx="22" fill="#0E0B19" />
          <text
            x="50"
            y="62"
            fill="#FFFFFF"
            fontSize="34"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="-1px"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            style={{ filter: 'drop-shadow(0 2px 10px rgba(153, 51, 255, 0.5))' }}
          >
            MAX
          </text>
        </svg>
      );

    case 'disney-plus':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Disney+"
        >
          <rect width="100" height="100" rx="22" fill="#0A1128" />
          {/* Distinctive Disney Swoosh */}
          <path
            d="M20 62C38 32 66 28 82 46"
            stroke="#0063E5"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <text
            x="44"
            y="59"
            fill="#FFFFFF"
            fontSize="34"
            fontWeight="800"
            fontFamily="serif"
            textAnchor="middle"
          >
            D
          </text>
          <path
            d="M68 44V58M61 51H75"
            stroke="#4A90E2"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'prime-video':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Prime Video"
        >
          <rect width="100" height="100" rx="22" fill="#0A1420" />
          <text
            x="50"
            y="48"
            fill="#FFFFFF"
            fontSize="21"
            fontWeight="800"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
          >
            prime
          </text>
          {/* Prime Video Smile Arrow */}
          <path
            d="M24 64C40 73 60 72 76 63"
            stroke="#00A8E1"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M72 58L78 63L73 68"
            fill="#00A8E1"
          />
        </svg>
      );

    case 'hulu':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Hulu"
        >
          <rect width="100" height="100" rx="22" fill="#091811" />
          <text
            x="50"
            y="61"
            fill="#1CE783"
            fontSize="30"
            fontWeight="900"
            letterSpacing="-1.5px"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            style={{ filter: 'drop-shadow(0 2px 10px rgba(28, 231, 131, 0.45))' }}
          >
            hulu
          </text>
        </svg>
      );

    case 'paramount-plus':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Paramount+"
        >
          <rect width="100" height="100" rx="22" fill="#0B132B" />
          {/* Mountain Silhouette */}
          <path
            d="M20 70L50 25L80 70H20Z"
            stroke="#0064FF"
            strokeWidth="4"
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d="M42 58L50 46L58 58H42Z"
            fill="#FFFFFF"
          />
          <path
            d="M72 38V48M67 43H77"
            stroke="#0064FF"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'peacock':
      return (
        <svg
          viewBox="0 0 100 100"
          className={`${sizeMap} ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Peacock"
        >
          <rect width="100" height="100" rx="22" fill="#14110A" />
          {/* Peacock Colorful Feathers Arc */}
          <circle cx="34" cy="46" r="6" fill="#F59E0B" />
          <circle cx="44" cy="38" r="6" fill="#10B981" />
          <circle cx="56" cy="38" r="6" fill="#3B82F6" />
          <circle cx="66" cy="46" r="6" fill="#8B5CF6" />
          <text
            x="50"
            y="72"
            fill="#FFFFFF"
            fontSize="15"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
          >
            peacock
          </text>
        </svg>
      );

    default:
      return (
        <div
          className={`${sizeMap} ${className} rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center font-bold text-white text-base`}
        >
          {platformId.slice(0, 2).toUpperCase()}
        </div>
      );
  }
};
