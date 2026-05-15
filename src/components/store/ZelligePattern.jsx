/**
 * Moroccan zellige-inspired 8-pointed star (khatam) geometric pattern.
 *
 * Construction: 80×80px tile with a full star at center (40,40) and
 * quarter-stars at each corner. Stars are built from two overlapping
 * squares (one axis-aligned, one rotated 45°), outer radius = 40/√2
 * so arms touch exactly at the tile corners (20,20), (60,20), etc.
 * Four connecting lozenges fill the gaps between adjacent star arms.
 */

// Star polygon centered at (cx, cy). Outer r = 28.28, inner r = 11.72.
function star(cx, cy) {
  const pts = [
    [cx,        cy - 28.28], // 0°
    [cx + 4.49, cy - 10.85], // 22.5°
    [cx + 20,   cy - 20],    // 45°
    [cx + 10.85,cy - 4.49],  // 67.5°
    [cx + 28.28,cy],         // 90°
    [cx + 10.85,cy + 4.49],  // 112.5°
    [cx + 20,   cy + 20],    // 135°
    [cx + 4.49, cy + 10.85], // 157.5°
    [cx,        cy + 28.28], // 180°
    [cx - 4.49, cy + 10.85], // 202.5°
    [cx - 20,   cy + 20],    // 225°
    [cx - 10.85,cy + 4.49],  // 247.5°
    [cx - 28.28,cy],         // 270°
    [cx - 10.85,cy - 4.49],  // 292.5°
    [cx - 20,   cy - 20],    // 315°
    [cx - 4.49, cy - 10.85], // 337.5°
  ];
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

export default function ZelligePattern({ id = 'zellige', opacity = 0.045, className = '' }) {
  const patternId = `pattern-${id}`;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Center star — full */}
            <polygon
              points={star(40, 40)}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            {/* Corner stars — clipped to visible quadrant by tile boundary */}
            <polygon points={star(0,  0)}  fill="none" stroke="currentColor" strokeWidth="0.75" />
            <polygon points={star(80, 0)}  fill="none" stroke="currentColor" strokeWidth="0.75" />
            <polygon points={star(0,  80)} fill="none" stroke="currentColor" strokeWidth="0.75" />
            <polygon points={star(80, 80)} fill="none" stroke="currentColor" strokeWidth="0.75" />

            {/* Connecting lozenges between center and each corner star */}
            {/* NW lozenge */}
            <polygon
              points="35.51,29.15 10.85,4.49 4.49,10.85 29.15,35.51"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            {/* NE lozenge */}
            <polygon
              points="44.49,29.15 69.15,4.49 75.51,10.85 50.85,35.51"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            {/* SE lozenge */}
            <polygon
              points="50.85,44.49 75.51,69.15 69.15,75.51 44.49,50.85"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            {/* SW lozenge */}
            <polygon
              points="35.51,50.85 10.85,75.51 4.49,69.15 29.15,44.49"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} opacity={opacity} />
      </svg>
    </div>
  );
}
