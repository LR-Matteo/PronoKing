import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createMarket, createMarketOption } from '@/lib/db';
import { MARKET_TYPES, MARKET_PRESETS } from '@/lib/constants';
import { Modal, Button, Message } from '@/components/ui/Components';
import { validateMarketLabel, validateOptionLabel, validateOdds } from '@/lib/validation';
import '@/styles/components/admin.css';

export default function AddMarketModal({ open, matchId, onClose, onAdded }) {
  const [type, setType] = useState('1N2');
  const [label, setLabel] = useState(MARKET_PRESETS['1N2'].label);
  const [options, setOptions] = useState([...MARKET_PRESETS['1N2'].options]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (t) => {
    setType(t);
    const preset = MARKET_PRESETS[t];
    if (preset) {
      setLabel(preset.label);
      setOptions([...preset.options.map((o) => ({ ...o }))]);
    }
  };

  const updateOption = (index, field, value) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o))
    );
  };

  const addOption = () => {
    setOptions([...options, { label: '', odds: 2.0 }]);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const labelErr = validateMarketLabel(label);
    if (labelErr) { setError(labelErr); return; }
    if (options.length < 2) { setError('Le marché doit avoir au moins 2 options'); return; }
    for (const o of options) {
      const optErr = validateOptionLabel(o.label);
      if (optErr) { setError(optErr); return; }
      const oddsErr = validateOdds(o.odds);
      if (oddsErr) { setError(`Cote invalide : ${oddsErr}`); return; }
    }

    setLoading(true);
    try {
      const market = await createMarket({ match_id: matchId, type, label: label.trim() });

      for (const opt of options) {
        await createMarketOption({
          market_id: market.id,
          label: opt.label.trim(),
          odds: parseFloat(opt.odds) || 2.0,
        });
      }
      onAdded();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un marché">
      <Message type="error">{error}</Message>

      {/* Market type pills */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block', fontFamily: 'Oswald', fontSize: 12,
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: 'var(--text-muted)', marginBottom: 8,
        }}>
          Type de marché
        </label>
        <div className="market-type-pills">
          {MARKET_TYPES.map((mt) => (
            <button
              key={mt.value}
              className={`market-pill ${type === mt.value ? 'active' : ''}`}
              onClick={() => handleTypeChange(mt.value)}
            >
              {mt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label>Label du marché</label>
        <input className="input-field" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      {/* Options */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block', fontFamily: 'Oswald', fontSize: 12,
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: 'var(--text-muted)', marginBottom: 8,
        }}>
          Options & Cotes
        </label>

        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              className="input-field"
              style={{ flex: 1, marginBottom: 0 }}
              value={opt.label}
              onChange={(e) => updateOption(i, 'label', e.target.value)}
              placeholder="Label de l'option"
            />
            <input
              className="input-field"
              style={{ width: 80, marginBottom: 0 }}
              type="number"
              step="0.1"
              min="1"
              value={opt.odds}
              onChange={(e) => updateOption(i, 'odds', parseFloat(e.target.value) || 1)}
            />
            {options.length > 2 && (
              <Button variant="ghost" size="sm" onClick={() => removeOption(i)} style={{ padding: 6 }}>
                <X size={14} />
              </Button>
            )}
          </div>
        ))}

        <Button variant="ghost" size="sm" onClick={addOption}>
          <Plus size={14} /> Ajouter une option
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="gold" onClick={handleSave} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
      </div>
    </Modal>
  );
}
