/* ============================================
   leaderboard.js — Firebase-backed leaderboard
   ============================================ */
const Leaderboard = (() => {
    const LOCAL_KEY = 'gv_leaderboard';
    const DEFAULTS = [
        { username: 'NeonBlade', score: 820, gamesPlayed: 34 },
        { username: 'PixelQueen', score: 690, gamesPlayed: 28 },
        { username: 'ShadowFox', score: 575, gamesPlayed: 22 },
        { username: 'CyberWolf', score: 450, gamesPlayed: 19 },
        { username: 'StarDust', score: 380, gamesPlayed: 15 },
        { username: 'GlitchRider', score: 310, gamesPlayed: 12 },
        { username: 'VoidWalker', score: 240, gamesPlayed: 10 },
    ];

    let _cachedList = null;

    /* --- Local cache for fast rendering --- */
    function getLocalAll() {
        let data = localStorage.getItem(LOCAL_KEY);
        if (!data) { localStorage.setItem(LOCAL_KEY, JSON.stringify(DEFAULTS)); return [...DEFAULTS]; }
        try { return JSON.parse(data); } catch(e) { return [...DEFAULTS]; }
    }

    function saveLocal(list) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
        _cachedList = list;
    }

    /* --- Get all (local cache, Firebase loads async) --- */
    function getAll() {
        if (_cachedList) return _cachedList;
        return getLocalAll();
    }

    /* --- Update both local and Firebase --- */
    function update(username, score, gamesPlayed) {
        const list = getLocalAll();
        const idx = list.findIndex(e => e.username === username);
        if (idx >= 0) { list[idx].score = score; list[idx].gamesPlayed = gamesPlayed; }
        else list.push({ username, score, gamesPlayed });
        list.sort((a, b) => b.score - a.score);
        saveLocal(list);
    }

    /* --- Load from Firebase and merge --- */
    async function syncFromFirebase() {
        try {
            const firebaseEntries = await FirebaseDB.getLeaderboardTop(50);
            if (firebaseEntries.length > 0) {
                const localList = getLocalAll();
                const merged = [...localList];

                firebaseEntries.forEach(fb => {
                    const idx = merged.findIndex(m => m.username === fb.username);
                    if (idx >= 0) {
                        // Keep higher score
                        if (fb.score > merged[idx].score) {
                            merged[idx].score = fb.score;
                            merged[idx].gamesPlayed = fb.gamesPlayed || merged[idx].gamesPlayed;
                        }
                    } else {
                        merged.push({
                            username: fb.username,
                            score: fb.score || 0,
                            gamesPlayed: fb.gamesPlayed || 0
                        });
                    }
                });

                merged.sort((a, b) => b.score - a.score);
                saveLocal(merged);
                console.log('☁️ Leaderboard synced from Firebase');
            }
        } catch (err) {
            console.warn('Leaderboard Firebase sync failed, using local data:', err);
        }
    }

    function getTop(n = 10) { return getAll().slice(0, n); }

    function renderCards() {
        const top = getTop(10);
        const trophies = ['🥇', '🥈', '🥉'];
        return `<div class="lb-cards">
      ${top.map((p, i) => {
            const topClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : '';
            const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const rankLabel = i < 3 ? trophies[i] : `#${i + 1}`;
            return `<div class="lb-card ${topClass} reveal" style="transition-delay:${i * 0.06}s">
          <div class="lb-rank ${rankClass}">${rankLabel}</div>
          <div class="lb-name">${p.username}</div>
          <div class="lb-score">${p.score} pts</div>
          <div class="lb-games">${p.gamesPlayed} games</div>
        </div>`;
        }).join('')}
    </div>`;
    }

    // Keep old renderTable for compatibility
    function renderTable() { return renderCards(); }

    // Sync from Firebase on load
    syncFromFirebase();

    return { getAll, update, getTop, renderTable, renderCards, syncFromFirebase };
})();
