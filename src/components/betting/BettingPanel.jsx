import { useState, useEffect } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { deleteBet, createBet } from '@/lib/db';
import { isMatchUpcoming } from '@/lib/utils';
import { MARKET_TYPES } from '@/lib/constants';
import { Button, Message, TokenCoin } from '@/components/ui/Components';

export default function BettingPanel({
  match,
  tournament,
  markets,
  marketOptions,
  bets,
  onBetsUpdated,
}) {
  const { user } = useAuth();
  const [myBets, setMyBets] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'error' });

  const canBet = match && !match.is_finished && isMatchUpcoming(match.kickoff);
  const tokensPerMatch = tournament?.tokens_per_match || 10;

  useEffect(() => {
    const existing = {};
    bets
      .filter((b) => b.user_id === user.id)
      .forEach((b) => { existing[b.market_option_id] = b.tokens; });
    setMyBets(existing);
  }, [bets, user.id]);

  const totalUsed = Object.values(myBets).reduce((s, v) => s + (parseInt(v) || 0), 0);
  const tokensLeft = tokensPerMatch - totalUsed;

  // Clic sur une option : sélectionner (1 jeton) ou désélectionner
  const handleSelect = (optId, marketId) => {
    setMyBets((prev) => {
      const next = { ...prev };
      // Effacer les autres options du même marché
      marketOptions
        .filter((o) => o.market_id === marketId && o.id !== optId)
        .forEach((o) => delete next[o.id]);
      // Toggle : si déjà sélectionné → désélectionner, sinon → 1 jeton
      if (next[optId]) {
        delete next[optId];
      } else {
        next[optId] = 1;
      }
      return next;
    });
  };

  // Boutons +/− sur une option déjà sélectionnée
  const handleAdjust = (optId, delta) => {
    setMyBets((prev) => {
      const current = prev[optId] || 0;
      const next = { ...prev };
      const newVal = current + delta;
      if (newVal <= 0) {
        delete next[optId];
      } else {
        next[optId] = newVal;
      }
      return next;
    });
  };

  const hasExistingBets = bets.some((b) => b.user_id === user.id);

  const saveBets = async () => {
    if (tokensLeft < 0) {
      setMsg({ text: 'Vous dépassez votre budget de jetons !', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const oldBets = bets.filter((b) => b.user_id === user.id);
      for (const ob of oldBets) await deleteBet(ob.id);

      for (const [optId, tokens] of Object.entries(myBets)) {
        if (tokens > 0) {
          await createBet({
            user_id: user.id,
            match_id: match.id,
            market_option_id: optId,
            tokens: parseInt(tokens),
            points_won: 0,
          });
        }
      }

      setMsg({ text: 'Paris enregistrés !', type: 'success' });
      onBetsUpdated();
      setTimeout(() => setMsg({ text: '', type: 'error' }), 3000);
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const getMarketTypeName = (type) =>
    MARKET_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div>
      <Message type={msg.type}>{msg.text}</Message>

      {/* Barre de budget */}
      {canBet && (
        <div className="tokens-summary" style={{ marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Jetons restants</span>
            <div className={`tokens-remaining ${tokensLeft < 0 ? 'over' : ''}`}>
              <TokenCoin size={18} />
              <span style={{ marginLeft: 6 }}>{tokensLeft} / {tokensPerMatch}</span>
            </div>
          </div>
          <Button variant="gold" onClick={saveBets} disabled={saving || tokensLeft < 0}>
            {saving ? '...' : hasExistingBets ? 'Modifier mes paris' : 'Valider mes paris'}
          </Button>
        </div>
      )}

      {/* Marchés */}
      {markets.map((market) => {
        const options = marketOptions.filter((o) => o.market_id === market.id);
        return (
          <div key={market.id} className="market-section">
            <div className="market-title">
              {market.label} — {getMarketTypeName(market.type)}
            </div>

            {options.map((opt) => {
              const myTokens = myBets[opt.id] || 0;
              const isSelected = myTokens > 0;
              const isWinner = opt.is_winner;
              const userBetOnThis = bets.find((b) => b.user_id === user.id && b.market_option_id === opt.id);

              let optClass = '';
              if (match.is_finished) {
                optClass = isWinner ? 'winner' : userBetOnThis ? 'loser' : '';
              } else if (isSelected) {
                optClass = 'selected';
              }

              return (
                <div
                  key={opt.id}
                  className={`bet-option ${optClass} ${canBet ? 'bet-option-clickable' : ''}`}
                  onClick={canBet ? () => handleSelect(opt.id, market.id) : undefined}
                >
                  {/* Indicateur de sélection */}
                  {canBet && (
                    <div className={`bet-option-radio ${isSelected ? 'active' : ''}`} />
                  )}

                  <span className="bet-option-label">
                    {opt.label}
                    {match.is_finished && isWinner && (
                      <Check size={14} style={{ marginLeft: 6, color: 'var(--accent-green)' }} />
                    )}
                  </span>

                  <span className="bet-option-odds">×{parseFloat(opt.odds).toFixed(2)}</span>

                  {canBet ? (
                    isSelected ? (
                      /* Contrôles +/- */
                      <div
                        className="token-adjuster"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="token-adj-btn"
                          onClick={() => handleAdjust(opt.id, -1)}
                          disabled={myTokens <= 1}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="token-adj-value">
                          <TokenCoin size={12} />
                          {myTokens}
                        </span>
                        <button
                          className="token-adj-btn"
                          onClick={() => handleAdjust(opt.id, +1)}
                          disabled={tokensLeft <= 0}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      /* Gain potentiel au survol */
                      <span className="bet-option-potential">
                        <TokenCoin size={11} /> ×{parseFloat(opt.odds).toFixed(2)}
                      </span>
                    )
                  ) : userBetOnThis ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontFamily: 'Oswald', color: 'var(--accent-gold)' }}>
                        {userBetOnThis.tokens}J
                      </div>
                      {match.is_finished && (
                        <div style={{
                          fontSize: 12,
                          color: parseFloat(userBetOnThis.points_won) > 0
                            ? 'var(--accent-green)'
                            : 'var(--text-muted)',
                        }}>
                          +{parseFloat(userBetOnThis.points_won).toFixed(1)}pts
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
