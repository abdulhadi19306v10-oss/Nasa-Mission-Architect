import React from 'react';

interface NasaCrestProps {
  size?: number;
  label?: string;
}

/**
 * Stylized vector aerospace insignia inspired by NASA flight directorate patches
 * (NASA Blue sphere, white orbital ellipse, vermilion vector chevron).
 */
export const NasaCrest: React.FC<NasaCrestProps> = ({ size = 34, label }) => {
  return (
    <div className="inline-flex items-center gap-2 shrink-0 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="shrink-0 drop-shadow-[0_2px_10px_rgba(16,91,216,0.5)]"
      >
        <circle cx="24" cy="24" r="21" fill="#0B3D91" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* White orbital path */}
        <ellipse
          cx="24"
          cy="24"
          rx="18"
          ry="7.5"
          transform="rotate(-24 24 24)"
          stroke="#F8FAFC"
          strokeWidth="1.5"
          strokeDasharray="2 1.5"
        />
        {/* Starburst accents */}
        <circle cx="14" cy="14" r="1.2" fill="#FFFFFF" />
        <circle cx="35" cy="15" r="1.1" fill="#FFFFFF" />
        <circle cx="33" cy="34" r="1.1" fill="#FFFFFF" />
        {/* Vermilion aerodynamic chevron */}
        <path
          d="M9 28 L23 11 L25 22 L38 19 L22 33 L21 24 Z"
          fill="#FC3D21"
        />
        <text
          x="24"
          y="28"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Chakra Petch, sans-serif"
          fontWeight="900"
          fontSize="9.5"
          letterSpacing="1"
        >
          NASA
        </text>
      </svg>
      {label && (
        <div className="font-mono leading-tight">
          <div className="text-[11px] font-black text-white tracking-widest uppercase">{label}</div>
          <div className="nasa-chevron-bar w-24 mt-0.5" />
        </div>
      )}
    </div>
  );
};
