import { useState } from 'react';
import teams from '@/data/teams.json';

function findLogo(name) {
  if (!name) return null;
  const q = name.toLowerCase();
  return teams.find((t) => t.name.toLowerCase() === q)?.logo || null;
}

export default function TeamLogo({ name, size = 32 }) {
  const logo = findLogo(name);
  const [error, setError] = useState(false);

  const style = {
    width: size,
    height: size,
    flexShrink: 0,
  };

  if (logo && !error) {
    return (
      <img
        src={logo}
        alt={name}
        style={{ ...style, objectFit: 'contain' }}
        onError={() => setError(true)}
      />
    );
  }

  // Fallback initiale
  return (
    <div
      style={{
        ...style,
        borderRadius: 4,
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Oswald',
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        color: 'var(--text-muted)',
      }}
    >
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}
