import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { createMatch, createMarket, createMarketOption } from '@/lib/db';
import { MARKET_TYPES, MARKET_PRESETS } from '@/lib/constants';
import { Modal, Button, Message } from '@/components/ui/Components';
import TeamInput from '@/components/ui/TeamInput';
import { validateTeamName, validateMarketLabel, validateOptionLabel, validateOdds } from '@/lib/validation';
import '@/styles/components/admin.css';

const makeMarket = (type = '1N2') => {
  const preset = MARKET_PRESETS[type];
  return {
    _id: Math.random().toString(36).slice(2),
    type,
    label: preset.label,
    options: preset.options.map((o) => ({ ...o })),
    collapsed: false,
  };
};

export default function AddMatchModal({ open, tournamentId, onClose, onAdded }) {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [kickoff, setKickoff] = useState('');
  const [markets, setMarkets] = useState([makeMarket('1N2')]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setHomeTeam('');
    setAwayTeam('');
    setKickoff('');
    setMarkets([makeMarket('1N2')]);
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  // ---- Gestion des marchés ----
  const addMarket = () => setMarkets((prev) => [...prev, makeMarket('1N2')]);

  const removeMarket = (id) => setMarkets((prev) => prev.filter((m) => m._id !== id));

  const toggleCollapse = (id) =>
    setMarkets((prev) => prev.map((m) => m._id === id ? { ...m, collapsed: !m.collapsed } : m));

  const updateMarketType = (id, type) => {
    const preset = MARKET_PRESETS[type];
    setMarkets((prev) =>
      prev.map((m) =>
        m._id === id
          ? { ...m, type, label: preset.label, options: preset.options.map((o) => ({ ...o })) }
          : m
      )
    );
  };

  const updateMarketLabel = (id, label) =>
    setMarkets((prev) => prev.map((m) => m._id === id ? { ...m, label } : m));

  const updateOption = (marketId, optIdx, field, value) =>
    setMarkets((prev) =>
      prev.map((m) =>
        m._id === marketId
          ? { ...m, options: m.options.map((o, i) => i === optIdx ? { ...o, [field]: value } : o) }
          : m
      )
    );

  const addOption = (marketId) =>
    setMarkets((prev) =>
      prev.map((m) =>
        m._id === marketId ? { ...m, options: [...m.options, { label: '', odds: 2.0 }] } : m
      )
    );

  const removeOption = (marketId, optIdx) =>
    setMarkets((prev) =>
      prev.map((m) =>
        m._id === marketId ? { ...m, options: m.options.filter((_, i) => i !== optIdx) } : m
      )
    );

  // ---- Sauvegarde tout d'un coup ----
  const handleSave = async () => {
    const homeErr = validateTeamName(homeTeam);
    if (homeErr) { setError(homeErr); return; }
    const awayErr = validateTeamName(awayTeam);
    if (awayErr) { setError(awayErr); return; }
    if (homeTeam.trim().toLowerCase() === awayTeam.trim().toLowerCase()) {
      setError('Les deux équipes ne peuvent pas être identiques'); return;
    }
    if (!kickoff) { setError('La date du coup d\'envoi est requise'); return; }

    for (const m of markets) {
      const labelErr = validateMarketLabel(m.label);
      if (labelErr) { setError(labelErr); return; }
      if (m.options.length < 2) { setError('Un marché doit avoir au moins 2 options'); return; }
      for (const o of m.options) {
        const optErr = validateOptionLabel(o.label);
        if (optErr) { setError(optErr); return; }
        const oddsErr = validateOdds(o.odds);
        if (oddsErr) { setError(`Cote invalide : ${oddsErr}`); return; }
      }
    }

    setLoading(true);
    try {
      const match = await createMatch({
        tournament_id: tournamentId,
        home_team: homeTeam.trim(),
        away_team: awayTeam.trim(),
        kickoff: new Date(kickoff).toISOString(),
      });

      // Créer tous les marchés en parallèle
      const createdMarkets = await Promise.all(
        markets.map((m) => createMarket({ match_id: match.id, type: m.type, label: m.label.trim() }))
      );

      // Créer toutes les options en parallèle (tous marchés confondus)
      await Promise.all(
        createdMarkets.flatMap((market, i) =>
          markets[i].options.map((opt) =>
            createMarketOption({
              market_id: market.id,
              label: opt.label.trim(),
              odds: parseFloat(opt.odds) || 2.0,
            })
          )
        )
      );

      reset();
      onAdded();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Ajouter un match">
      <Message type="error">{error}</Message>

      {/* ---- Infos du match ---- */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
        <div className="input-group" style={{ flex: 1, marginBottom: 12 }}>
          <label>Domicile</label>
          <TeamInput value={homeTeam} onChange={setHomeTeam} placeholder="Ex: France" />
        </div>
        <div className="input-group" style={{ flex: 1, marginBottom: 12 }}>
          <label>Extérieur</label>
          <TeamInput value={awayTeam} onChange={setAwayTeam} placeholder="Ex: Allemagne" />
        </div>
      </div>

      <div className="input-group">
        <label>Coup d'envoi</label>
        <input
          className="input-field"
          type="datetime-local"
          value={kickoff}
          onChange={(e) => setKickoff(e.target.value)}
        />
      </div>

      {/* ---- Séparateur marchés ---- */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '20px 0 14px',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, fontFamily: 'Oswald', letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Marchés de paris
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* ---- Liste des marchés ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {markets.map((market, mIdx) => (
          <div key={market._id} style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}>
            {/* En-tête du marché */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
              onClick={() => toggleCollapse(market._id)}
            >
              <span style={{ flex: 1, fontFamily: 'Oswald', fontSize: 13, color: 'var(--text-secondary)' }}>
                {market.label || `Marché ${mIdx + 1}`}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {market.options.length} options
              </span>
              {markets.length > 1 && (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 2, display: 'flex' }}
                  onClick={(e) => { e.stopPropagation(); removeMarket(market._id); }}
                >
                  <X size={14} />
                </button>
              )}
              {market.collapsed ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronUp size={14} color="var(--text-muted)" />}
            </div>

            {/* Corps du marché */}
            {!market.collapsed && (
              <div style={{ padding: '12px 14px' }}>
                {/* Type */}
                <div className="market-type-pills" style={{ marginBottom: 10 }}>
                  {MARKET_TYPES.map((mt) => (
                    <button
                      key={mt.value}
                      className={`market-pill ${market.type === mt.value ? 'active' : ''}`}
                      onClick={() => updateMarketType(market._id, mt.value)}
                    >
                      {mt.label}
                    </button>
                  ))}
                </div>

                {/* Label */}
                <div className="input-group" style={{ marginBottom: 10 }}>
                  <label>Intitulé</label>
                  <input
                    className="input-field"
                    value={market.label}
                    onChange={(e) => updateMarketLabel(market._id, e.target.value)}
                    placeholder="Ex: Résultat final"
                  />
                </div>

                {/* Options */}
                <label style={{
                  display: 'block', fontFamily: 'Oswald', fontSize: 11,
                  letterSpacing: 1.5, textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 8,
                }}>
                  Options & Cotes
                </label>
                {market.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input
                      className="input-field"
                      style={{ flex: 1, marginBottom: 0 }}
                      value={opt.label}
                      onChange={(e) => updateOption(market._id, oIdx, 'label', e.target.value)}
                      placeholder="Label"
                    />
                    <input
                      className="input-field"
                      style={{ width: 72, marginBottom: 0 }}
                      type="number"
                      step="0.1"
                      min="1"
                      value={opt.odds}
                      onChange={(e) => updateOption(market._id, oIdx, 'odds', e.target.value)}
                    />
                    {market.options.length > 2 && (
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
                        onClick={() => removeOption(market._id, oIdx)}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}

                <Button variant="ghost" size="sm" onClick={() => addOption(market._id)}>
                  <Plus size={13} /> Ajouter une option
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="ghost" size="sm" onClick={addMarket} style={{ marginBottom: 20 }}>
        <Plus size={14} /> Ajouter un marché
      </Button>

      {/* ---- Actions ---- */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="gold" onClick={handleSave} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Créer le match'}
        </Button>
        <Button variant="ghost" onClick={handleClose}>Annuler</Button>
      </div>
    </Modal>
  );
}
