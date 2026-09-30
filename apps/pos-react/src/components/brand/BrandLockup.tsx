import type { CSSProperties } from "react";

/**
 * Arcom POS — lockup horizontal (isotipo + wordmark + claim).
 *
 * Inline SVG a propósito: un SVG referenciado por `<img>` se renderiza como
 * documento aislado y no resuelve la fuente web de la página. El wordmark es
 * `<text font-family="Inter">` (no paths) y el POS ahora embebe Inter vía
 * @fontsource en `main.tsx`, así que inline sale Inter real.
 *
 * Un único viewBox ("9.5 13.5 742 205.5") para la variante con claim y la
 * compacta: comparten la misma caja (el claim no baja más que el trazo del
 * isotipo). Clear space = 40 u (el board pide 30, pero la dispersión medida
 * entre familias de fuentes es de 30 u — 40 u queda 1.33x por encima).
 *
 * Fill de la variante:
 *  - `primary`: wordmark ink #1f1a17, claim stone #6e635c — sobre sand/paper.
 *  - `negative`: wordmark sand #f6f1ea, claim mist #c4b9aa — sobre ink.
 *  - El isotipo y el "POS" siempre en terra-500 (el board fija la marca).
 */

interface BrandLockupProps {
  /** `primary` = superficies claras (sand/paper). `negative` = superficies oscuras (ink). */
  variant?: "primary" | "negative";
  /** Muestra el claim "Vendé sin depender de nadie." */
  claim?: boolean;
  /** Ancho en px; la altura deriva del aspect 742:205.5. */
  width?: number;
  style?: CSSProperties;
}

const VIEWBOX = "9.5 13.5 742 205.5";
const ASPECT = 742 / 205.5;

// Brand tokens (Ruta C) — equivalentes a los de la landing.
const INK = "#1f1a17";
const SAND = "#f6f1ea";
const STONE = "#6e635c";
const MIST = "#c4b9aa";
const TERRA_500 = "#c75b39";

export function BrandLockup({ variant = "primary", claim = true, width, style }: BrandLockupProps) {
  const negative = variant === "negative";
  const wordmarkFill = negative ? SAND : INK;
  const claimFill = negative ? MIST : STONE;
  const dotFill = negative ? SAND : INK;

  return (
    <svg
      viewBox={VIEWBOX}
      width={width}
      style={{ aspectRatio: `${ASPECT}`, display: "block", height: "auto", ...style }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Arcom POS"
      focusable="false"
    >
      <g transform="translate(16 25) scale(0.66)">
        <path
          d="M64 220V132a64 64 0 0 1 128 0v88"
          fill="none"
          stroke={TERRA_500}
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="128" cy="140" r="30" fill={dotFill} />
      </g>
      <text
        x="212"
        y="122"
        fontFamily="Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="92"
        fontWeight="800"
        letterSpacing="-2"
        fill={wordmarkFill}
      >
        Arcom<tspan fontWeight="500" fill={TERRA_500}> POS</tspan>
      </text>
      {claim && (
        <text
          x="216"
          y="172"
          fontFamily="Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
          fontSize="26"
          fontWeight="500"
          letterSpacing="1.5"
          fill={claimFill}
        >
          Vendé sin depender de nadie.
        </text>
      )}
    </svg>
  );
}