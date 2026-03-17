import { useState, useEffect, useRef } from 'react';
import teams from '@/data/teams.json';
import TeamLogo from './TeamLogo';

export default function TeamInput({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Synchronise si la valeur est réinitialisée depuis l'extérieur
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Calcule les suggestions
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    setSuggestions(
      teams
        .filter((t) => t.name.toLowerCase().includes(q))
        .slice(0, 7)
    );
  }, [query]);

  const select = (team) => {
    setQuery(team.name);
    onChange(team.name);
    setSuggestions([]);
    setOpen(false);
  };

  // Ferme au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          <TeamLogo name={query} size={22} />
        </div>
        <input
          className="input-field"
          style={{ paddingLeft: 42 }}
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="team-suggestions">
          {suggestions.map((t) => (
            <div
              key={t.name}
              className="team-suggestion"
              onMouseDown={() => select(t)}
            >
              <TeamLogo name={t.name} size={24} />
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
