/* ============================================
   app.js — SPA Router, Pages, Loader, Utils v2
   ============================================ */

const GameUtils = {
  confetti() {
    const colors = ['#00f0ff', '#ff00aa', '#7b2ff7', '#00ff88', '#ffd700', '#ff6b35'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.top = '-10px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (Math.random() * 8 + 5) + 'px';
      p.style.height = (Math.random() * 8 + 5) + 'px';
      p.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
      p.style.setProperty('--fall-duration', (Math.random() * 2 + 1.5) + 's');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 4000);
    }
  }
};

const GAME_DEFS = [
  { id: 'quiz', name: 'Quiz Challenge', desc: 'Test your knowledge with multiple choice questions and climb the score ladder.', icon: '🧠' },
  { id: 'memory', name: 'Memory Card Match', desc: 'Flip cards and find matching pairs. Train your memory and beat your record!', icon: '🃏' },
  { id: 'snake', name: 'Snake Game', desc: 'Classic snake with increasing speed. How long can you survive the grid?', icon: '🐍' },
  { id: 'tictactoe', name: 'Tic Tac Toe', desc: 'Challenge the computer AI in a battle of strategy and wits.', icon: '❌' },
  { id: 'rps', name: 'Rock Paper Scissors', desc: 'The classic showdown! Best your opponent with the right pick.', icon: '✊' },
  { id: 'reaction', name: 'Reaction Time', desc: 'Test your reflexes! Click as fast as you can when the color changes.', icon: '⚡' },
  { id: 'colormatch', name: 'Color Match', desc: 'Does the word match the color? Test your brain with this tricky challenge!', icon: '🎨' },
  { id: 'mathsprint', name: 'Math Sprint', desc: 'Solve arithmetic problems as fast as you can. Race against yourself!', icon: '🧮' },
  { id: 'wordscramble', name: 'Word Scramble', desc: 'Unscramble jumbled letters to form the correct word.', icon: '📝' },
  { id: 'whackamole', name: 'Whack-a-Mole', desc: 'Targets appear randomly — click them fast to rack up points!', icon: '🎯' },
];

const GAME_MODULES = { quiz: QuizGame, memory: MemoryGame, snake: SnakeGame, tictactoe: TicTacToeGame, rps: RPSGame, reaction: ReactionGame, colormatch: ColorMatchGame, mathsprint: MathSprintGame, wordscramble: WordScrambleGame, whackamole: WhackAMoleGame };

/* --- Scroll Reveal Observer --- */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
}

/* --- Navbar scroll effect --- */
function initNavScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
  });
}

/* --- Loader --- */
function runLoader(cb) {
  const bar = document.getElementById('loader-bar');
  const pct = document.getElementById('loader-percent');
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 8 + 2;
    if (p > 100) p = 100;
    bar.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
    if (p >= 100) { clearInterval(iv); setTimeout(() => { document.getElementById('loader').classList.add('hidden'); cb(); }, 600); }
  }, 80);
}

/* --- Router --- */
function getRoute() { return (location.hash.slice(1) || 'home'); }

function navigate() {
  const route = getRoute(), main = document.getElementById('main-content');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.nav === route.split('/')[0]));
  document.getElementById('nav-links').classList.remove('open');

  if (route === 'home') main.innerHTML = renderHome();
  else if (route === 'games') main.innerHTML = renderGames();
  else if (route === 'leaderboard') main.innerHTML = renderLeaderboard();
  else if (route === 'profile') main.innerHTML = renderProfile();
  else if (route === 'login') main.innerHTML = renderLogin();
  else if (route.startsWith('game/')) renderGamePage(main, route.split('/')[1]);
  else main.innerHTML = renderHome();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Re-init scroll reveals after page change
  requestAnimationFrame(() => initScrollReveal());
}

/* ============================================
   PAGE RENDERERS
   ============================================ */
function renderHome() {
  const top = Leaderboard.getTop(3);
  const trophies = ['🥇', '🥈', '🥉'];
  const player = Auth.getPlayer();
  return `<div class="page">
    <section class="hero">
      <h1 class="hero-title">GAMEVERSE</h1>
      <p class="hero-tagline">Play. Compete. Conquer.</p>
      <button class="hero-btn" onclick="location.hash='#games'">🎮 PLAY NOW</button>
      <div class="hero-stats">
        <div class="hero-stat"><div class="hero-stat-value">10</div><div class="hero-stat-label">Games</div></div>
        <div class="hero-stat"><div class="hero-stat-value">∞</div><div class="hero-stat-label">Fun</div></div>
      </div>
    </section>
    <section class="section">
      <h2 class="section-title reveal">🎮 Featured Games</h2>
      <p class="section-subtitle reveal">Jump into any game and start earning XP</p>
      <div class="games-grid">${GAME_DEFS.slice(0, 3).map((g, i) => gameCard(g, i)).join('')}</div>
    </section>
    <section class="section">
      <h2 class="section-title reveal">⚡ Daily Challenge</h2>
      <p class="section-subtitle reveal">Complete today's challenge for bonus XP</p>
      <div class="reveal">${DailyChallenge.renderSection()}</div>
    </section>
    <section class="section">
      <h2 class="section-title reveal">🏆 Top Players</h2>
      <p class="section-subtitle reveal">The legends of GameVerse</p>
      <div class="top-players-list">
        ${top.map((p, i) => `<div class="glass-card top-player-card reveal" style="transition-delay:${i * 0.1}s">
          <div class="top-player-rank">${trophies[i]}</div>
          <div class="top-player-name">${p.username}</div>
          <div class="top-player-score">${p.score} pts</div>
        </div>`).join('')}
      </div>
    </section>
    <section class="section">
      <h2 class="section-title reveal">🏅 Achievements</h2>
      <p class="section-subtitle reveal">Unlock badges by playing and reaching milestones</p>
      <div class="achievements-grid reveal">${Achievements.renderAchievementsGrid()}</div>
    </section>
    <section class="section">
      <h2 class="section-title reveal">About GameVerse</h2>
      <p class="section-subtitle reveal">Your ultimate gaming playground</p>
      <div class="about-grid">
        <div class="glass-card about-card reveal" style="transition-delay:0s"><div class="about-icon">🎮</div><h3>10 Mini-Games</h3><p>From brain teasers to reflex challenges, something for everyone.</p></div>
        <div class="glass-card about-card reveal" style="transition-delay:.1s"><div class="about-icon">🏆</div><h3>Leaderboards</h3><p>Compete globally and climb the ranks to become champion.</p></div>
        <div class="glass-card about-card reveal" style="transition-delay:.2s"><div class="about-icon">⚡</div><h3>XP & Levels</h3><p>Earn XP, level up, and unlock achievements as you play.</p></div>
        <div class="glass-card about-card reveal" style="transition-delay:.3s"><div class="about-icon">🎯</div><h3>Daily Challenges</h3><p>New challenges every day with bonus XP rewards.</p></div>
      </div>
    </section>
    <section class="cta-section reveal">
      <h2>Ready to Play?</h2>
      <p>Join GameVerse and rise to the top of the leaderboard.</p>
      <button class="hero-btn" onclick="location.hash='${player ? '#games' : '#login'}'" style="font-size:.9rem;padding:14px 42px">
        ${player ? '🎮 START PLAYING' : '🚀 GET STARTED'}
      </button>
    </section>
  </div>`;
}

function gameCard(g, idx) {
  const delay = idx !== undefined ? `style="transition-delay:${(idx || 0) * 0.08}s"` : '';
  return `<div class="game-card reveal" ${delay} onclick="location.hash='#game/${g.id}'">
    <div class="game-card-img">${g.icon}</div>
    <div class="game-card-body">
      <div class="game-card-title">${g.name}</div>
      <div class="game-card-desc">${g.desc}</div>
      <span class="game-card-btn">Play Now →</span>
    </div>
  </div>`;
}

function renderGames() {
  return `<div class="page"><section class="section">
    <h2 class="section-title reveal">🎮 All Games</h2>
    <p class="section-subtitle reveal">Pick a game and start playing</p>
    <div class="search-bar reveal"><span class="search-icon">🔍</span><input type="text" id="game-search" placeholder="Search games..." oninput="filterGames()"></div>
    <div class="games-grid" id="games-grid-container">${GAME_DEFS.map((g, i) => gameCard(g, i)).join('')}</div>
  </section></div>`;
}

function filterGames() {
  const q = document.getElementById('game-search').value.toLowerCase();
  const c = document.getElementById('games-grid-container');
  const f = GAME_DEFS.filter(g => g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q));
  c.innerHTML = f.length ? f.map((g, i) => gameCard(g, i)).join('') : '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">No games found.</p>';
  initScrollReveal();
}

function renderGamePage(main, gid) {
  const def = GAME_DEFS.find(g => g.id === gid);
  if (!def) { main.innerHTML = renderHome(); return; }
  main.innerHTML = `<div class="page game-page">
    <div class="game-header"><h2>${def.icon} ${def.name}</h2>
      <div class="game-controls">
        <button class="btn-game btn-restart" id="game-restart-btn">↻ Restart</button>
        <button class="btn-game btn-back" onclick="location.hash='#games'">← Back</button>
      </div>
    </div>
    <div class="game-area" id="game-area"></div>
  </div>`;
  const area = document.getElementById('game-area'), mod = GAME_MODULES[gid];
  if (mod) { mod.init(area); document.getElementById('game-restart-btn').addEventListener('click', () => mod.init(area)); }
}

function renderLeaderboard() {
  return `<div class="page"><section class="section">
    <h2 class="section-title reveal">🏆 Leaderboard</h2>
    <p class="section-subtitle reveal">Top players ranked by total score</p>
    <div class="reveal">${Leaderboard.renderCards()}</div>
  </section></div>`;
}

function renderProfile() {
  const p = Auth.getPlayer();
  if (!p) return `<div class="page login-page"><div class="login-card"><h2>Profile</h2><p>Please log in to view your profile.</p><button class="login-btn" onclick="location.hash='#login'">Go to Login</button></div></div>`;
  const lv = Auth.getLevel(p.xp), xpProg = Auth.getXpProgress(p.xp), ini = p.username.charAt(0).toUpperCase();
  return `<div class="page"><section class="section">
    <div class="profile-header reveal">
      <div class="profile-avatar">${ini}</div>
      <div class="profile-info">
        <h2>${p.username}</h2>
        <div class="profile-level"><span class="badge">Level ${lv}</span></div>
        <div class="xp-bar-container"><div class="xp-bar-track"><div class="xp-bar-fill" style="width:${xpProg}%"></div></div><div class="xp-text">${xpProg}/100 XP to Level ${lv + 1}</div></div>
      </div>
    </div>
    <div class="profile-stats-grid">
      <div class="profile-stat-card reveal" style="transition-delay:0s"><div class="stat-value">${p.gamesPlayed || 0}</div><div class="stat-label">Games Played</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.08s"><div class="stat-value">${p.wins || 0}</div><div class="stat-label">Victories</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.16s"><div class="stat-value">${p.totalScore || 0}</div><div class="stat-label">Total Score</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.24s"><div class="stat-value">${p.xp || 0}</div><div class="stat-label">Total XP</div></div>
    </div>
    <h3 class="section-title reveal" style="font-size:1.2rem">🏅 Achievements</h3>
    <p class="section-subtitle reveal">Your unlocked badges</p>
    <div class="achievements-grid reveal" style="margin-bottom:44px">${Achievements.renderAchievementsGrid()}</div>
    <h3 class="section-title reveal" style="font-size:1.2rem">📊 Best Scores</h3>
    <p class="section-subtitle reveal">Personal records across all games</p>
    <div class="profile-stats-grid">
      ${GAME_DEFS.map((g, i) => {
    const key = g.id === 'quiz' ? 'quizBest' : g.id === 'memory' ? 'memoryWins' : g.id === 'snake' ? 'snakeBest' : g.id === 'tictactoe' ? 'tttWins' : g.id === 'rps' ? 'rpsBest' : 'reactionBest';
    let v = p[key] || 0, lb = 'Best Score';
    if (g.id === 'memory') lb = 'Wins'; if (g.id === 'tictactoe') lb = 'Wins'; if (g.id === 'rps') lb = 'Win Streak';
    if (g.id === 'reaction') { lb = 'Best Time'; v = v === 9999 || v === 0 ? '—' : v + 'ms'; }
    return `<div class="profile-stat-card reveal" style="transition-delay:${i * .06}s"><div style="font-size:1.5rem;margin-bottom:4px">${g.icon}</div><div class="stat-value">${v}</div><div class="stat-label">${g.name}<br>${lb}</div></div>`;
  }).join('')}
    </div>
  </section></div>`;
}

function renderLogin() {
  const p = Auth.getPlayer();
  if (p) return `<div class="page login-page"><div class="login-card"><h2>Welcome Back!</h2><p>Logged in as <strong style="color:var(--neon-cyan)">${p.username}</strong></p><button class="login-btn" onclick="location.hash='#games'" style="margin-top:12px">🎮 Play Games</button><button class="login-btn" onclick="location.hash='#profile'" style="margin-top:12px;background:var(--bg-glass);border:1px solid var(--border-glass)">👤 View Profile</button></div></div>`;
  return `<div class="page login-page"><div class="login-card"><h2>Join GameVerse</h2><p>Enter your username to start playing, earning XP, and unlocking achievements.</p><input type="text" class="login-input" id="login-username" placeholder="Enter your username" maxlength="20" onkeydown="if(event.key==='Enter')handleLogin()"><button class="login-btn" onclick="handleLogin()">🚀 START PLAYING</button></div></div>`;
}

function handleLogin() {
  const i = document.getElementById('login-username');
  if (!i) return;
  const u = i.value.trim();
  if (!u) { i.style.borderColor = 'var(--neon-pink)'; return; }
  Auth.login(u); Auth.updateNavbar(); GameUtils.confetti(); location.hash = '#home';
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  Particles.init();
  initNavScroll();
  runLoader(() => { Auth.updateNavbar(); navigate(); DailyChallenge.startTimer(); });
  window.addEventListener('hashchange', navigate);
  document.getElementById('nav-hamburger').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
  });
});
