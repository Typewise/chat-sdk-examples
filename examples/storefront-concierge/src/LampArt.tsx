export type Finish = {
  name: string;
  shade: string;
  shadeShadow: string;
  metal: string;
  backdrop: [string, string];
};

export const FINISHES: Finish[] = [
  {
    name: 'Sand',
    shade: '#e9dcc8',
    shadeShadow: '#cdb999',
    metal: '#b08d5b',
    backdrop: ['#f6efe4', '#ead9c0'],
  },
  {
    name: 'Sage',
    shade: '#b7c4a5',
    shadeShadow: '#8d9c79',
    metal: '#6f7d5d',
    backdrop: ['#eef1e8', '#d6dfca'],
  },
  {
    name: 'Charcoal',
    shade: '#4b4b52',
    shadeShadow: '#2f2f35',
    metal: '#c9a46a',
    backdrop: ['#ecebef', '#cfcdd6'],
  },
];

export function LampArt({
  finish,
  glow = true,
  tilt = 0,
}: {
  finish: Finish;
  glow?: boolean;
  tilt?: number;
}) {
  const id = `lamp-${finish.name}-${tilt}`;
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={`Halo lamp in ${finish.name}`}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={finish.backdrop[0]} />
          <stop offset="1" stopColor={finish.backdrop[1]} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4d6" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={finish.shadeShadow} />
          <stop offset="0.45" stopColor={finish.shade} />
          <stop offset="1" stopColor={finish.shadeShadow} />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={finish.metal} stopOpacity="0.7" />
          <stop offset="0.5" stopColor={finish.metal} />
          <stop offset="1" stopColor={finish.metal} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}-bg)`} />
      <ellipse cx="200" cy="330" rx="120" ry="14" fill="#000" opacity="0.08" />
      <g transform={`rotate(${tilt} 200 330)`}>
        {glow && <circle cx="200" cy="200" r="150" fill={`url(#${id}-glow)`} />}
        <rect
          x="194"
          y="170"
          width="12"
          height="150"
          rx="6"
          fill={`url(#${id}-metal)`}
        />
        <rect
          x="130"
          y="314"
          width="140"
          height="18"
          rx="9"
          fill={`url(#${id}-metal)`}
        />
        <path
          d="M110 182 C110 110 150 78 200 78 C250 78 290 110 290 182 Z"
          fill={`url(#${id}-shade)`}
        />
        <ellipse cx="200" cy="182" rx="90" ry="10" fill={finish.shadeShadow} />
        {glow && (
          <ellipse
            cx="200"
            cy="184"
            rx="70"
            ry="6"
            fill="#fff7df"
            opacity="0.9"
          />
        )}
      </g>
    </svg>
  );
}
