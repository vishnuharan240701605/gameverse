/* ============================================
   achievements.js — Achievement definitions & unlock system
   ============================================ */
const Achievements = (() => {
    const DEFINITIONS = [
        { id: 'first_game', name: 'First Game Played', desc: 'Play your first game', icon: '🎮', condition: d => d.gamesPlayed >= 1 },
        { id: 'first_win', name: 'First Victory', desc: 'Win a game for the first time', icon: '🏆', condition: d => d.wins >= 1 },
        { id: 'score_100', name: 'Century Club', desc: 'Score 100 total points', icon: '💯', condition: d => d.totalScore >= 100 },
        { id: 'play_10', name: 'Dedicated Gamer', desc: 'Play 10 games', icon: '🔥', condition: d => d.gamesPlayed >= 10 },
        { id: 'memory_master', name: 'Memory Master', desc: 'Complete Memory Match', icon: '🧠', condition: d => d.memoryWins >= 1 },
        { id: 'snake_survivor', name: 'Snake Survivor', desc: 'Score 50+ in Snake', icon: '🐍', condition: d => d.snakeBest >= 50 },
    ];

    function getPlayerData() {
        return JSON.parse(localStorage.getItem('gv_player') || '{}');
    }

    function getUnlocked() {
        return JSON.parse(localStorage.getItem('gv_achievements') || '[]');
    }

    function saveUnlocked(list) {
        localStorage.setItem('gv_achievements', JSON.stringify(list));
    }

    /* Check all achievements and return newly unlocked ones */
    function check() {
        const data = getPlayerData();
        const unlocked = getUnlocked();
        const newlyUnlocked = [];
        DEFINITIONS.forEach(a => {
            if (!unlocked.includes(a.id) && a.condition(data)) {
                unlocked.push(a.id);
                newlyUnlocked.push(a);
            }
        });
        if (newlyUnlocked.length > 0) saveUnlocked(unlocked);
        return newlyUnlocked;
    }

    /* Show animated popup for each new achievement */
    function showPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
      <div class="achieve-icon">${achievement.icon}</div>
      <div>
        <div class="achieve-label">Achievement Unlocked!</div>
        <div class="achieve-name">${achievement.name}</div>
      </div>
    `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 4200);
    }

    /* Check and notify */
    function checkAndNotify() {
        const newOnes = check();
        newOnes.forEach((a, i) => {
            setTimeout(() => showPopup(a), i * 600);
        });
    }

    function renderAchievementsGrid() {
        const unlocked = getUnlocked();
        return DEFINITIONS.map(a => {
            const isUnlocked = unlocked.includes(a.id);
            return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}">
          <div class="achievement-icon">${a.icon}</div>
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
      `;
        }).join('');
    }

    return { DEFINITIONS, check, checkAndNotify, getUnlocked, renderAchievementsGrid };
})();
