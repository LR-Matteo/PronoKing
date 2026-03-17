import { Lock, Unlock, Users } from 'lucide-react';
import { Badge, TokenCoin } from '@/components/ui/Components';

export default function TournamentCard({ tournament, memberCount, isMember, isAdmin, onClick }) {
  const isFull = tournament.max_members !== null && memberCount >= tournament.max_members;

  return (
    <div className="card card-hover card-clickable" onClick={onClick}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 20, margin: 0 }}>{tournament.name}</h3>
        <span style={{ color: tournament.is_locked ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
          {tournament.is_private || tournament.is_locked ? <Lock size={16} /> : <Unlock size={16} />}
        </span>
      </div>

      {tournament.description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
          {tournament.description}
        </p>
      )}

      <div className="flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isFull ? 'var(--accent-gold)' : 'var(--text-muted)', fontSize: 13 }}>
          <Users size={14} />
          {memberCount}{tournament.max_members ? ` / ${tournament.max_members}` : ''} joueur{memberCount > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TokenCoin size={16} />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {tournament.tokens_per_match} / match
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {isMember && <Badge color="green">Inscrit</Badge>}
        {isAdmin && <Badge color="gold">Admin</Badge>}
        {tournament.is_locked && <Badge color="red">Verrouillé</Badge>}
        {!tournament.is_locked && isFull && <Badge color="red">Complet</Badge>}
      </div>
    </div>
  );
}
