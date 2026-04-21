import React from 'react';

export const SVGS = {
  rover: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><rect x="10" y="15" width="12" height="20" rx="4" fill="#333" /><rect x="10" y="40" width="12" height="20" rx="4" fill="#333" /><rect x="10" y="65" width="12" height="20" rx="4" fill="#333" /><rect x="78" y="15" width="12" height="20" rx="4" fill="#333" /><rect x="78" y="40" width="12" height="20" rx="4" fill="#333" /><rect x="78" y="65" width="12" height="20" rx="4" fill="#333" /><rect x="18" y="10" width="64" height="80" rx="8" fill="#e2e8f0" stroke="#201d4c" strokeWidth="4"/><rect x="26" y="25" width="48" height="50" rx="4" fill="#f59e0b" stroke="#201d4c" strokeWidth="3"/><line x1="26" y1="37" x2="74" y2="37" stroke="#201d4c" strokeWidth="2" /><line x1="26" y1="50" x2="74" y2="50" stroke="#201d4c" strokeWidth="2" /><line x1="26" y1="63" x2="74" y2="63" stroke="#201d4c" strokeWidth="2" /><rect x="46" y="5" width="8" height="25" fill="#201d4c" /><circle cx="50" cy="8" r="7" fill="#201d4c" /><circle cx="50" cy="8" r="3" fill="#38bdf8" /></svg>
  ),
  car: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      {/* Trailer Hitch */}
      <rect x="48" y="55" width="4" height="15" fill="#334155" />
      
      {/* Trailer */}
      <rect x="30" y="70" width="40" height="25" rx="2" fill="#fcd34d" stroke="#b45309" strokeWidth="2" />
      
      {/* Trailer wheels */}
      <rect x="25" y="75" width="5" height="15" rx="2" fill="#1e293b" />
      <rect x="70" y="75" width="5" height="15" rx="2" fill="#1e293b" />

      {/* Car Body (Front) */}
      <rect x="30" y="10" width="40" height="45" rx="6" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
      
      {/* Windshields */}
      <rect x="34" y="25" width="32" height="12" rx="2" fill="#93c5fd" />
      <rect x="34" y="45" width="32" height="6" rx="1" fill="#93c5fd" />
      
      {/* Car wheels */}
      <rect x="25" y="15" width="5" height="12" rx="2" fill="#1e293b" />
      <rect x="70" y="15" width="5" height="12" rx="2" fill="#1e293b" />
      <rect x="25" y="38" width="5" height="12" rx="2" fill="#1e293b" />
      <rect x="70" y="38" width="5" height="12" rx="2" fill="#1e293b" />
    </svg>
  ),
  obstacle: (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-90 drop-shadow-sm"><circle cx="50" cy="50" r="40" fill="#78350f" /><circle cx="40" cy="40" r="10" fill="#451a03" opacity="0.5"/><circle cx="65" cy="55" r="15" fill="#451a03" opacity="0.5"/><circle cx="45" cy="70" r="8" fill="#451a03" opacity="0.5"/></svg>
  ),
  crater: (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-90 drop-shadow-sm">
      <ellipse cx="50" cy="50" rx="40" ry="25" fill="#854d0e" />
      <ellipse cx="50" cy="52" rx="35" ry="20" fill="#422006" />
      <ellipse cx="35" cy="48" rx="6" ry="3" fill="#281404" />
      <ellipse cx="65" cy="55" rx="4" ry="2" fill="#281404" />
    </svg>
  ),
  alien: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><ellipse cx="50" cy="45" rx="20" ry="25" fill="#22c55e" opacity="0.9" /><ellipse cx="50" cy="65" rx="40" ry="12" fill="#94a3b8" /><ellipse cx="50" cy="62" rx="40" ry="4" fill="#475569" /><circle cx="30" cy="65" r="3" fill="#bef264" /><circle cx="50" cy="67" r="3" fill="#bef264" /><circle cx="70" cy="65" r="3" fill="#bef264" /></svg>
  ),
  target: (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><rect x="45" y="20" width="10" height="60" fill="#cbd5e1" stroke="#201d4c" strokeWidth="2"/><path d="M50" y="20" fill="none" /><polygon points="50,20 90,35 50,50" fill="#22c55e" stroke="#201d4c" strokeWidth="2"/><ellipse cx="50" cy="85" rx="30" ry="10" fill="#94a3b8" stroke="#201d4c" strokeWidth="2"/></svg>
  ),
  wait: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#201d4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  arrowUp: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#201d4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
  ),
  arrowLeft: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#201d4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
  ),
  arrowRight: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#201d4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path></svg>
  )
};
