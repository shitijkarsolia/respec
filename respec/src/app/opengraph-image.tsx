import { ImageResponse } from 'next/og';

export const alt = 'Respec — Visual Spec Review for Kiro';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Branded, dependency-free OG card (no remote fonts/assets so the build stays hermetic).
export default function OpengraphImage() {
  const columns = [
    { label: 'Requirements', color: '#10b981' },
    { label: 'Design', color: '#a855f7' },
    { label: 'Tasks', color: '#22c55e' },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #09090b 0%, #111827 55%, #052e23 100%)',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 84, fontWeight: 800, letterSpacing: '-3px', color: '#fafafa' }}>
            Re<span style={{ color: '#34d399' }}>spec</span>
          </div>
          <div style={{ fontSize: 36, color: '#d4d4d8', maxWidth: 760, lineHeight: 1.3 }}>
            Visual spec review for Kiro — see coverage, flag issues, compile feedback, approve.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {columns.map((col) => (
            <div
              key={col.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: '14px',
                padding: '28px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `6px solid ${col.color}`,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {col.label}
              </div>
              <div style={{ height: 14, width: '85%', borderRadius: 8, background: 'rgba(255,255,255,0.16)' }} />
              <div style={{ height: 14, width: '65%', borderRadius: 8, background: 'rgba(255,255,255,0.10)' }} />
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
