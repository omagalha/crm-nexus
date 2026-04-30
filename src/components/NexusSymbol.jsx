export default function NexusSymbol({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3C6 6 11 10 15 16C11 22 6 26 4 29"
        stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 3C13 6 17 10 19.5 16C17 22 13 26 11 29"
        stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 3C34 6 29 10 25 16C29 22 34 26 36 29"
        stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29 3C27 6 23 10 20.5 16C23 22 27 26 29 29"
        stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
