import { useState } from 'react';
import { Check } from 'lucide-react';
import { updateMatch, updateMarketOption, updateBet } from '@/lib/db';
import { Modal, Button, Message } from '@/components/ui/Components';

export default function ValidateMatchModal({ open, match, markets, marketOptions, bets, onClose, onValidated }) {
  const [homeScore, setHomeScore] = useState(match?.home_score ?? '');
  const [awayScore, setAwayScore] = useState(match?.away_score ?? '');
  const [winners, setWinners] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleWinner = (optId) => {
    setWinners((prev) => ({ ...prev, [optId]: !prev[optId] }));
  };

  const handleValidate = async () => {
    setSaving(true);
    try {
      // Update match score
      await updateMatch(match.id, {
        home_score: parseInt(homeScore) || 0,
        away_score: parseInt(awayScore) || 0,
        is_finished: true,
      });

      // Process each option
      const matchMarketIds = markets.filter((m) => m.match_id === match.id).map((m) => m.id);
      const matchOptions = marketOptions.filter((o) => matchMarketIds.includes(o.market_id));

      for (const opt of matchOptions) {
        const isWin = !!winners[opt.id];
        await updateMarketOption(opt.id, { is_winner: isWin });

        const optionBets = bets.filter((b) => b.market_option_id === opt.id);
        for (const bet of optionBets) {
          const points = isWin ? bet.tokens * parseFloat(opt.odds) : 0;
          await updateBet(bet.id, { points_won: points });
        }
      }

      onValidated();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  if (!match) return null;

  const matchMarkets = markets.filter((m) => m.match_id === match.id);

  return (
    <Modal open={open} onClose={onClose} title="Valider le résultat">
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        {match.home_team} vs {match.away_team}
      </p>

      <Message type="error">{error}</Message>

      {/* Score inputs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div className="input-group" style={{ flex: 1 }}>
          <label>{match.home_team}</label>
          <input
            className="input-field"
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label>{match.away_team}</label>
          <input
            className="input-field"
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Winner selection per market */}
      <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)', fontFamily: 'Oswald', textTransform: 'uppercase', letterSpacing: 1 }}>
        Sélectionnez les options gagnantes
      </h3>

      {matchMarkets.map((market) => {
        const opts = marketOptions.filter((o) => o.market_id === market.id);
        return (
          <div key={market.id} className="market-section">
            <div className="market-title">{market.label}</div>
            {opts.map((opt) => (
              <div
                key={opt.id}
                className={`bet-option ${winners[opt.id] ? 'winner' : ''}`}
                onClick={() => toggleWinner(opt.id)}
                style={{ cursor: 'pointer' }}
              >
                <span className="bet-option-label">{opt.label}</span>
                <span className="bet-option-odds">×{parseFloat(opt.odds).toFixed(2)}</span>
                {winners[opt.id] && <Check size={18} style={{ color: 'var(--accent-green)' }} />}
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button variant="gold" onClick={handleValidate} disabled={saving}>
          {saving ? 'Validation...' : 'Valider et calculer les points'}
        </Button>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
      </div>
    </Modal>
  );
}
