const generateId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// ==================== SEED DATA ====================
const adminId = generateId();
const userId1 = generateId();
const userId2 = generateId();
const tId = generateId();
const m1 = generateId();
const m2 = generateId();
const m3 = generateId();

// Markets
const mk1 = generateId();
const mk2 = generateId();
const mk3 = generateId();
const mk4 = generateId();
const mk5 = generateId();

// Options
const o1 = generateId(); const o2 = generateId(); const o3 = generateId();
const o4 = generateId(); const o5 = generateId(); const o6 = generateId();
const o7 = generateId(); const o8 = generateId(); const o9 = generateId();
const o10 = generateId(); const o11 = generateId(); const o12 = generateId();
const o13 = generateId(); const o14 = generateId();

const now = Date.now();

const store = {
  profiles: [
    { id: adminId, username: 'admin', password_hash: 'admin123', created_at: new Date().toISOString() },
    { id: userId1, username: 'marco', password_hash: 'pass123', created_at: new Date().toISOString() },
    { id: userId2, username: 'lucas', password_hash: 'pass123', created_at: new Date().toISOString() },
  ],
  tournaments: [
    {
      id: tId,
      name: 'Euro 2026',
      description: 'Pronostiquez les matchs de l\'Euro 2026 et devenez le roi !',
      is_private: false,
      password: null,
      tokens_per_match: 10,
      max_members: null,
      is_locked: false,
      admin_id: adminId,
      created_at: new Date().toISOString(),
    },
  ],
  tournament_members: [
    { id: generateId(), tournament_id: tId, user_id: adminId, joined_at: new Date().toISOString() },
    { id: generateId(), tournament_id: tId, user_id: userId1, joined_at: new Date().toISOString() },
    { id: generateId(), tournament_id: tId, user_id: userId2, joined_at: new Date().toISOString() },
  ],
  matches: [
    {
      id: m1, tournament_id: tId, home_team: 'France', away_team: 'Allemagne',
      kickoff: new Date(now - 86400000).toISOString(),
      home_score: 2, away_score: 1, is_finished: true,
      created_at: new Date().toISOString(),
    },
    {
      id: m2, tournament_id: tId, home_team: 'Espagne', away_team: 'Italie',
      kickoff: new Date(now + 86400000).toISOString(),
      home_score: null, away_score: null, is_finished: false,
      created_at: new Date().toISOString(),
    },
    {
      id: m3, tournament_id: tId, home_team: 'Portugal', away_team: 'Belgique',
      kickoff: new Date(now + 172800000).toISOString(),
      home_score: null, away_score: null, is_finished: false,
      created_at: new Date().toISOString(),
    },
  ],
  markets: [
    { id: mk1, match_id: m1, type: '1N2', label: 'Résultat final', created_at: new Date().toISOString() },
    { id: mk2, match_id: m1, type: 'exact_score', label: 'Score exact', created_at: new Date().toISOString() },
    { id: mk3, match_id: m2, type: '1N2', label: 'Résultat final', created_at: new Date().toISOString() },
    { id: mk4, match_id: m2, type: 'total_goals', label: 'Total de buts', created_at: new Date().toISOString() },
    { id: mk5, match_id: m3, type: '1N2', label: 'Résultat final', created_at: new Date().toISOString() },
  ],
  market_options: [
    { id: o1, market_id: mk1, label: 'France', odds: 1.8, is_winner: true },
    { id: o2, market_id: mk1, label: 'Nul', odds: 3.2, is_winner: false },
    { id: o3, market_id: mk1, label: 'Allemagne', odds: 2.5, is_winner: false },
    { id: o4, market_id: mk2, label: '2-1', odds: 6.5, is_winner: true },
    { id: o5, market_id: mk2, label: '1-0', odds: 5.0, is_winner: false },
    { id: o6, market_id: mk2, label: '1-1', odds: 4.5, is_winner: false },
    { id: o7, market_id: mk3, label: 'Espagne', odds: 2.1, is_winner: false },
    { id: o8, market_id: mk3, label: 'Nul', odds: 3.0, is_winner: false },
    { id: o9, market_id: mk3, label: 'Italie', odds: 2.8, is_winner: false },
    { id: o10, market_id: mk4, label: '0-1 buts', odds: 3.5, is_winner: false },
    { id: o11, market_id: mk4, label: '2-3 buts', odds: 2.0, is_winner: false },
    { id: o12, market_id: mk4, label: '4+ buts', odds: 3.0, is_winner: false },
    { id: o13, market_id: mk5, label: 'Portugal', odds: 1.9, is_winner: false },
    { id: o14, market_id: mk5, label: 'Belgique', odds: 2.4, is_winner: false },
  ],
  bets: [
    { id: generateId(), user_id: adminId, match_id: m1, market_option_id: o1, tokens: 5, points_won: 9, created_at: new Date().toISOString() },
    { id: generateId(), user_id: adminId, match_id: m1, market_option_id: o4, tokens: 5, points_won: 32.5, created_at: new Date().toISOString() },
    { id: generateId(), user_id: userId1, match_id: m1, market_option_id: o3, tokens: 7, points_won: 0, created_at: new Date().toISOString() },
    { id: generateId(), user_id: userId1, match_id: m1, market_option_id: o6, tokens: 3, points_won: 0, created_at: new Date().toISOString() },
    { id: generateId(), user_id: userId2, match_id: m1, market_option_id: o1, tokens: 4, points_won: 7.2, created_at: new Date().toISOString() },
    { id: generateId(), user_id: userId2, match_id: m1, market_option_id: o5, tokens: 6, points_won: 0, created_at: new Date().toISOString() },
  ],
};

// ==================== IN-MEMORY QUERY BUILDER ====================

function createQueryBuilder(table) {
  let filters = [];
  let orderCol = null;
  let orderAsc = true;
  let limitN = null;
  let singleRow = false;
  let insertData = null;
  let updateData = null;
  let isDelete = false;

  const builder = {
    select: () => builder,
    eq: (col, val) => { filters.push((r) => r[col] === val); return builder; },
    neq: (col, val) => { filters.push((r) => r[col] !== val); return builder; },
    gt: (col, val) => { filters.push((r) => r[col] > val); return builder; },
    gte: (col, val) => { filters.push((r) => r[col] >= val); return builder; },
    lt: (col, val) => { filters.push((r) => r[col] < val); return builder; },
    lte: (col, val) => { filters.push((r) => r[col] <= val); return builder; },
    in: (col, vals) => { filters.push((r) => vals.includes(r[col])); return builder; },
    order: (col, opts = {}) => {
      orderCol = col;
      orderAsc = opts.ascending !== false;
      return builder;
    },
    limit: (n) => { limitN = n; return builder; },
    single: () => { singleRow = true; return builder; },
    insert: (data) => { insertData = data; return builder; },
    update: (data) => { updateData = data; return builder; },
    delete: () => { isDelete = true; return builder; },
    then: (resolve) => {
      try {
        // INSERT
        if (insertData) {
          const items = Array.isArray(insertData) ? insertData : [insertData];
          const created = items.map((item) => ({
            id: generateId(),
            ...item,
            created_at: item.created_at || new Date().toISOString(),
          }));
          store[table] = [...store[table], ...created];
          resolve({ data: created.length === 1 ? created[0] : created, error: null });
          return;
        }

        // DELETE
        if (isDelete) {
          let results = [...store[table]];
          filters.forEach((f) => { results = results.filter(f); });
          store[table] = store[table].filter((r) => !results.includes(r));
          resolve({ data: results, error: null });
          return;
        }

        // SELECT / UPDATE
        let results = [...store[table]];
        filters.forEach((f) => { results = results.filter(f); });

        if (updateData) {
          results.forEach((r) => Object.assign(r, updateData));
          resolve({ data: singleRow ? results[0] || null : results, error: null });
          return;
        }

        if (orderCol) {
          results.sort((a, b) => {
            if (a[orderCol] < b[orderCol]) return orderAsc ? -1 : 1;
            if (a[orderCol] > b[orderCol]) return orderAsc ? 1 : -1;
            return 0;
          });
        }

        if (limitN) results = results.slice(0, limitN);
        resolve({ data: singleRow ? results[0] || null : results, error: null });
      } catch (e) {
        resolve({ data: null, error: { message: e.message } });
      }
    },
  };

  return builder;
}

export const demoDb = {
  from: (table) => createQueryBuilder(table),
};

export { store as demoStore };
