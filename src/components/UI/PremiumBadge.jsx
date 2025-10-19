/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Premium Verification Badge
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Blue checkmark badge for premium users (Twitter/Instagram style).
 * Appears next to user names across the app.
 */

export default function PremiumBadge({ size = 16, style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
      title="Premium User"
    >
      {/* Blue circle with white checkmark */}
      <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
      <path 
        d="M7 12.5l3 3 7-7" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

