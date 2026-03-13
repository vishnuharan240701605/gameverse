/* ============================================
   app.js — SPA Router, Pages, Loader, Utils v4
   ============================================ */

const GameUtils = {
  confetti() {
    const colors = ['#00f5ff', '#ff2e63', '#7b61ff', '#00ff88', '#ffd700', '#ff6b35'];
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
  { id: 'quiz', name: 'Quiz Challenge', desc: 'Test your knowledge with multiple choice questions and climb the score ladder.', icon: '🧠', bestKey: 'quizBest', bestLabel: 'Best Score' },
  { id: 'memory', name: 'Memory Card Match', desc: 'Flip cards and find matching pairs. Train your memory and beat your record!', icon: '🃏', bestKey: 'memoryWins', bestLabel: 'Wins' },
  { id: 'snake', name: 'Snake Game', desc: 'Classic snake with increasing speed. How long can you survive the grid?', icon: '🐍', bestKey: 'snakeBest', bestLabel: 'Best Score' },
  { id: 'tictactoe', name: 'Tic Tac Toe', desc: 'Challenge the computer AI in a battle of strategy and wits.', icon: '❌', bestKey: 'tttWins', bestLabel: 'Wins' },
  { id: 'rps', name: 'Rock Paper Scissors', desc: 'The classic showdown! Best your opponent with the right pick.', icon: '✊', bestKey: 'rpsBest', bestLabel: 'Win Streak' },
  { id: 'reaction', name: 'Reaction Time', desc: 'Test your reflexes! Click as fast as you can when the color changes.', icon: '⚡', bestKey: 'reactionBest', bestLabel: 'Best Time', isTime: true },
  { id: 'colormatch', name: 'Color Match', desc: 'Does the word match the color? Test your brain with this tricky challenge!', icon: '🎨', bestKey: 'colormatchBest', bestLabel: 'Best Score' },
  { id: 'mathsprint', name: 'Math Sprint', desc: 'Solve arithmetic problems as fast as you can. Race against yourself!', icon: '🧮', bestKey: 'mathsprintBest', bestLabel: 'Best Score' },
  { id: 'wordscramble', name: 'Word Scramble', desc: 'Unscramble jumbled letters to form the correct word.', icon: '📝', bestKey: 'wordscrambleBest', bestLabel: 'Best Score' },
  { id: 'whackamole', name: 'Whack-a-Mole', desc: 'Targets appear randomly — click them fast to rack up points!', icon: '🎯', bestKey: 'whackamoleBest', bestLabel: 'Best Score' },
];

const GAME_INSTRUCTIONS = {
  quiz: { howTo: 'Answer multiple choice questions correctly.', controls: 'Click on the correct answer option.', goal: 'Score as high as possible across 10 questions.' },
  memory: { howTo: 'Flip cards to find matching emoji pairs.', controls: 'Click cards to flip them. Match 2 identical cards.', goal: 'Match all pairs in the fewest moves.' },
  snake: { howTo: 'Guide the snake to eat food and grow longer.', controls: 'Arrow keys or WASD / On-screen buttons.', goal: 'Eat food without hitting walls or yourself.' },
  tictactoe: { howTo: 'Place X marks to get 3 in a row before the CPU.', controls: 'Click on empty cells to place your mark.', goal: 'Get 3 in a row (horizontal, vertical, or diagonal).' },
  rps: { howTo: 'Pick Rock, Paper, or Scissors against the CPU.', controls: 'Click your choice. Rock > Scissors > Paper > Rock.', goal: 'Win as many rounds as possible.' },
  reaction: { howTo: 'Wait for the box to turn green, then click fast.', controls: 'Click the colored box when it turns green.', goal: 'Achieve the fastest average reaction time in 5 tries.' },
  colormatch: { howTo: 'Decide if the word matches the color it is displayed in.', controls: 'Click Match or No Match.', goal: 'Correctly identify 15 color-word combinations.' },
  mathsprint: { howTo: 'Solve arithmetic problems quickly.', controls: 'Click the correct answer from 4 options.', goal: 'Get the highest score in 12 problems.' },
  wordscramble: { howTo: 'Unscramble the jumbled letters to form a word.', controls: 'Type your answer and press Enter or click Submit.', goal: 'Unscramble 10 words correctly.' },
  whackamole: { howTo: 'Click targets as they appear in the grid.', controls: 'Click on the 🎯 target before it moves.', goal: 'Hit as many targets as possible in 30 seconds.' },
};

const AVATARS = [
  { emoji: '🎮', name: 'Gamer', cost: 0 },
  { emoji: '🐉', name: 'Dragon', cost: 50 },
  { emoji: '🦊', name: 'Fox', cost: 100 },
  { emoji: '🤖', name: 'Robot', cost: 200 },
  { emoji: '👾', name: 'Alien', cost: 350 },
  { emoji: '🦁', name: 'Lion', cost: 500 },
  { emoji: '🧙', name: 'Wizard', cost: 750 },
  { emoji: '🔥', name: 'Flame', cost: 1000 },
];

const REGISTER_AVATARS = ['🎮', '👤', '🐉', '🦊', '🤖', '👾', '🦁', '🧙', '🔥', '🐺', '🦅', '🎯'];

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

function cleanupGames() {
  if (typeof SnakeGame !== 'undefined' && SnakeGame.cleanup) SnakeGame.cleanup();
  if (typeof WhackAMoleGame !== 'undefined' && WhackAMoleGame.cleanup) WhackAMoleGame.cleanup();
  if (typeof ReactionGame !== 'undefined' && ReactionGame.cleanup) ReactionGame.cleanup();
}

function navigate() {
  cleanupGames();
  const route = getRoute(), main = document.getElementById('main-content');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.nav === route.split('/')[0]));
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('nav-hamburger').classList.remove('active');

  if (route === 'home') main.innerHTML = renderHome();
  else if (route === 'games') main.innerHTML = renderGames();
  else if (route === 'leaderboard') main.innerHTML = renderLeaderboard();
  else if (route === 'achievements') main.innerHTML = renderAchievementsPage();
  else if (route === 'profile') main.innerHTML = renderProfile();
  else if (route === 'login') main.innerHTML = renderLoginPage();
  else if (route === 'register') main.innerHTML = renderRegisterPage();
  else if (route.startsWith('game/')) renderGamePage(main, route.split('/')[1]);
  else main.innerHTML = renderHome();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => { initScrollReveal(); UI.onPageLoad(); });
}

/* ============================================
   GAME INSTRUCTIONS MODAL
   ============================================ */
function showGameInstructions(gameId, callback) {
  const def = GAME_DEFS.find(g => g.id === gameId);
  const instr = GAME_INSTRUCTIONS[gameId];
  if (!def || !instr) { callback(); return; }

  const modal = document.createElement('div');
  modal.className = 'game-modal-overlay';
  modal.innerHTML = `
    <div class="game-modal">
      <div class="game-modal-icon">${def.icon}</div>
      <h3 class="game-modal-title">${def.name}</h3>
      <div class="game-modal-section">
        <div class="game-modal-label">📖 How to Play</div>
        <p>${instr.howTo}</p>
      </div>
      <div class="game-modal-section">
        <div class="game-modal-label">🎮 Controls</div>
        <p>${instr.controls}</p>
      </div>
      <div class="game-modal-section">
        <div class="game-modal-label">🎯 Goal</div>
        <p>${instr.goal}</p>
      </div>
      <button class="hero-btn game-modal-start" style="margin-top:20px;padding:14px 44px;font-size:.9rem;" id="modal-start">🚀 START GAME</button>
      <button class="game-modal-close" id="modal-close">✕</button>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('visible'));

  document.getElementById('modal-start').addEventListener('click', () => {
    modal.classList.remove('visible');
    setTimeout(() => { modal.remove(); callback(); }, 300);
    SoundFX.play('gameStart');
  });
  document.getElementById('modal-close').addEventListener('click', () => {
    modal.classList.remove('visible');
    setTimeout(() => modal.remove(), 300);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('visible');
      setTimeout(() => modal.remove(), 300);
    }
  });
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
      <p class="section-subtitle reveal">Complete today's challenge for bonus XP & coins</p>
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
        <div class="glass-card about-card reveal" style="transition-delay:.3s"><div class="about-icon">🪙</div><h3>Coin Rewards</h3><p>Earn coins, unlock avatars, and customize your profile.</p></div>
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
    <div class="game-area" id="game-area"><div class="game-loading"><div class="game-loading-spinner"></div><div style="margin-top:16px;color:var(--text-muted);font-size:.85rem;">Loading game...</div></div></div>
  </div>`;
  const area = document.getElementById('game-area');
  const mod = GAME_MODULES[gid];
  showGameInstructions(gid, () => {
    if (mod) {
      mod.init(area);
      document.getElementById('game-restart-btn').addEventListener('click', () => { cleanupGames(); mod.init(area); });
    }
  });
}

function renderLeaderboard() {
  return `<div class="page"><section class="section">
    <h2 class="section-title reveal">🏆 Leaderboard</h2>
    <p class="section-subtitle reveal">Top players ranked by total score</p>
    <div class="reveal">${Leaderboard.renderCards()}</div>
  </section></div>`;
}

function renderAchievementsPage() {
  const unlocked = Achievements.getUnlocked();
  const total = Achievements.DEFINITIONS.length;
  const pct = Math.round((unlocked.length / total) * 100);
  return `<div class="page"><section class="section">
    <h2 class="section-title reveal">🏅 Achievements</h2>
    <p class="section-subtitle reveal">Unlock badges by playing and reaching milestones</p>
    <div class="glass-card reveal" style="text-align:center;margin-bottom:40px;padding:30px;">
      <div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--neon-cyan);">${unlocked.length}/${total}</div>
      <div style="color:var(--text-muted);font-size:.8rem;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Achievements Unlocked</div>
      <div class="xp-bar-track" style="max-width:300px;margin:16px auto 0;"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="achievements-grid reveal">${Achievements.renderAchievementsGrid()}</div>
  </section></div>`;
}

/* ============================================
   LOGIN PAGE
   ============================================ */
function renderLoginPage() {
  const p = Auth.getPlayer();
  if (p) {
    return `<div class="page login-page"><div class="auth-card">
      <div class="auth-avatar-display">${p.avatar || '🎮'}</div>
      <h2 class="auth-title">Welcome Back!</h2>
      <p class="auth-subtitle">Logged in as <strong style="color:var(--neon-cyan)">${p.username}</strong></p>
      <p style="color:var(--text-muted);font-size:.82rem;margin-bottom:20px;">Level ${Auth.getLevel(p.xp)} • 🪙 ${p.coins || 0} coins • ${p.gamesPlayed || 0} games played</p>
      <button class="auth-btn primary" onclick="location.hash='#games'">🎮 Play Games</button>
      <button class="auth-btn secondary" onclick="location.hash='#profile'">👤 View Profile</button>
      <button class="auth-btn ghost" onclick="handleLogout()">🚪 Logout</button>
    </div></div>`;
  }
  return `<div class="page login-page"><div class="auth-card">
    <div class="auth-logo">🎮</div>
    <h2 class="auth-title">Welcome to GameVerse</h2>
    <p class="auth-subtitle">Sign in to track your scores, earn XP, and unlock achievements</p>
    <div id="auth-error" class="auth-error" style="display:none;"></div>
    <div class="auth-field">
      <label class="auth-label">Username</label>
      <input type="text" class="auth-input" id="login-username" placeholder="Enter your username" maxlength="20" onkeydown="if(event.key==='Enter')document.getElementById('login-password').focus()">
    </div>
    <div class="auth-field">
      <label class="auth-label">Password</label>
      <div class="auth-password-wrap">
        <input type="password" class="auth-input" id="login-password" placeholder="Enter your password" maxlength="32" onkeydown="if(event.key==='Enter')handleLogin()">
        <button class="auth-eye" onclick="togglePasswordVisibility('login-password', this)" type="button">👁️</button>
      </div>
    </div>
    <div class="auth-row">
      <label class="auth-checkbox-wrap"><input type="checkbox" id="login-remember"> <span>Remember me</span></label>
    </div>
    <button class="auth-btn primary" onclick="handleLogin()">🚀 LOGIN</button>
    <div class="auth-divider"><span>or</span></div>
    <button class="auth-btn ghost" onclick="handleGuestLogin()">👤 Play as Guest</button>
    <p class="auth-footer-text">Don't have an account? <a href="#register" class="auth-link">Register here</a></p>
  </div></div>`;
}

/* ============================================
   REGISTER PAGE
   ============================================ */
function renderRegisterPage() {
  return `<div class="page login-page"><div class="auth-card">
    <div class="auth-logo">🚀</div>
    <h2 class="auth-title">Join GameVerse</h2>
    <p class="auth-subtitle">Create an account to save your progress and compete</p>
    <div id="auth-error" class="auth-error" style="display:none;"></div>
    <div class="auth-field">
      <label class="auth-label">Username</label>
      <input type="text" class="auth-input" id="reg-username" placeholder="Choose a username" maxlength="20">
    </div>
    <div class="auth-field">
      <label class="auth-label">Email <span style="color:var(--text-muted);font-size:.7rem">(optional)</span></label>
      <input type="email" class="auth-input" id="reg-email" placeholder="your@email.com" maxlength="50">
    </div>
    <div class="auth-field">
      <label class="auth-label">Password</label>
      <div class="auth-password-wrap">
        <input type="password" class="auth-input" id="reg-password" placeholder="Min 4 characters" maxlength="32">
        <button class="auth-eye" onclick="togglePasswordVisibility('reg-password', this)" type="button">👁️</button>
      </div>
    </div>
    <div class="auth-field">
      <label class="auth-label">Confirm Password</label>
      <div class="auth-password-wrap">
        <input type="password" class="auth-input" id="reg-confirm" placeholder="Re-enter password" maxlength="32" onkeydown="if(event.key==='Enter')handleRegister()">
        <button class="auth-eye" onclick="togglePasswordVisibility('reg-confirm', this)" type="button">👁️</button>
      </div>
    </div>
    <div class="auth-field">
      <label class="auth-label">Choose Avatar</label>
      <div class="auth-avatar-grid" id="avatar-grid">
        ${REGISTER_AVATARS.map((a, i) => `<div class="auth-avatar-option ${i === 0 ? 'selected' : ''}" data-avatar="${a}" onclick="selectRegAvatar(this)">${a}</div>`).join('')}
      </div>
    </div>
    <button class="auth-btn primary" onclick="handleRegister()">🎮 CREATE ACCOUNT</button>
    <div class="auth-divider"><span>or</span></div>
    <button class="auth-btn ghost" onclick="handleGuestLogin()">👤 Play as Guest</button>
    <p class="auth-footer-text">Already have an account? <a href="#login" class="auth-link">Login here</a></p>
  </div></div>`;
}

/* ============================================
   AUTH HANDLERS
   ============================================ */
function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = 'authShake .4s ease'; });
}

function togglePasswordVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁️';
  }
}

function selectRegAvatar(el) {
  document.querySelectorAll('.auth-avatar-option').forEach(a => a.classList.remove('selected'));
  el.classList.add('selected');
}

function handleLogin() {
  const u = (document.getElementById('login-username')?.value || '').trim();
  const p = document.getElementById('login-password')?.value || '';
  const remember = document.getElementById('login-remember')?.checked || false;
  if (!u) { showAuthError('Please enter your username'); return; }
  const result = Auth.login(u, p, remember);
  if (!result.ok) { showAuthError(result.msg); return; }
  Auth.updateNavbar();
  SoundFX.play('win');
  GameUtils.confetti();
  location.hash = '#home';
}

function handleRegister() {
  const u = (document.getElementById('reg-username')?.value || '').trim();
  const e = (document.getElementById('reg-email')?.value || '').trim();
  const p = document.getElementById('reg-password')?.value || '';
  const c = document.getElementById('reg-confirm')?.value || '';
  const avatarEl = document.querySelector('.auth-avatar-option.selected');
  const avatar = avatarEl ? avatarEl.dataset.avatar : '🎮';

  if (!u) { showAuthError('Please choose a username'); return; }
  if (u.length < 3) { showAuthError('Username must be at least 3 characters'); return; }
  if (!p) { showAuthError('Please enter a password'); return; }
  if (p.length < 4) { showAuthError('Password must be at least 4 characters'); return; }
  if (p !== c) { showAuthError('Passwords do not match'); return; }

  const result = Auth.register(u, e, p, avatar);
  if (!result.ok) { showAuthError(result.msg); return; }

  Auth.updateNavbar();
  SoundFX.play('win');
  GameUtils.confetti();
  location.hash = '#home';
}

function handleGuestLogin() {
  Auth.loginAsGuest();
  Auth.updateNavbar();
  SoundFX.play('gameStart');
  location.hash = '#games';
}

function handleLogout() {
  Auth.logout();
  SoundFX.play('click');
  location.hash = '#login';
}

/* ============================================
   PROFILE PAGE
   ============================================ */
function renderProfile() {
  const p = Auth.getPlayer();
  if (!p) return `<div class="page login-page"><div class="auth-card"><h2 class="auth-title">Profile</h2><p class="auth-subtitle">Please log in to view your profile.</p><button class="auth-btn primary" onclick="location.hash='#login'">Go to Login</button></div></div>`;
  const lv = Auth.getLevel(p.xp), xpProg = Auth.getXpProgress(p.xp);
  const avatar = p.avatar || '🎮';
  const nextLvXp = Auth.getXpForLevel(lv + 1);
  const currLvXp = Auth.getXpForLevel(lv);
  return `<div class="page"><section class="section">
    <div class="profile-header reveal">
      <div class="profile-avatar">${avatar}</div>
      <div class="profile-info">
        <h2>${p.username}</h2>
        <div class="profile-level"><span class="badge">Level ${lv}</span> <span class="coin-badge-lg">🪙 ${p.coins || 0}</span></div>
        <div class="xp-bar-container">
          <div class="xp-bar-track"><div class="xp-bar-fill xp-bar-animated" style="width:${xpProg}%"></div></div>
          <div class="xp-text">${(Number(p.xp)||0) - currLvXp} / ${nextLvXp - currLvXp} XP to Level ${lv + 1}</div>
        </div>
      </div>
    </div>
    <div class="profile-stats-grid">
      <div class="profile-stat-card reveal" style="transition-delay:0s"><div class="stat-value">${p.gamesPlayed || 0}</div><div class="stat-label">Games Played</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.08s"><div class="stat-value">${p.wins || 0}</div><div class="stat-label">Victories</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.16s"><div class="stat-value">${p.totalScore || 0}</div><div class="stat-label">Total Score</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.24s"><div class="stat-value">${p.highestScore || 0}</div><div class="stat-label">Highest Score</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.32s"><div class="stat-value">${p.xp || 0}</div><div class="stat-label">Total XP</div></div>
      <div class="profile-stat-card reveal" style="transition-delay:.40s"><div class="stat-value">🪙 ${p.coins || 0}</div><div class="stat-label">Coins</div></div>
    </div>

    <h3 class="section-title reveal" style="font-size:1.2rem">🎨 Avatars</h3>
    <p class="section-subtitle reveal">Spend coins to unlock avatars</p>
    <div class="avatar-grid reveal">
      ${AVATARS.map(a => {
        const owned = (Number(p.coins) || 0) >= a.cost || a.cost === 0;
        const selected = avatar === a.emoji;
        return `<div class="avatar-card ${selected ? 'selected' : ''} ${owned ? 'owned' : 'locked'}" onclick="${owned ? `selectAvatar('${a.emoji}')` : ''}">
          <div class="avatar-emoji">${a.emoji}</div>
          <div class="avatar-name">${a.name}</div>
          <div class="avatar-cost">${a.cost === 0 ? 'Free' : (owned ? '✓ Owned' : '🪙 ' + a.cost)}</div>
        </div>`;
      }).join('')}
    </div>

    <h3 class="section-title reveal" style="font-size:1.2rem">🏅 Achievements</h3>
    <p class="section-subtitle reveal">Your unlocked badges</p>
    <div class="achievements-grid reveal" style="margin-bottom:44px">${Achievements.renderAchievementsGrid()}</div>

    <h3 class="section-title reveal" style="font-size:1.2rem">📊 Best Scores</h3>
    <p class="section-subtitle reveal">Personal records across all games</p>
    <div class="profile-stats-grid">
      ${GAME_DEFS.map((g, i) => {
        let v = Number(p[g.bestKey]) || 0;
        let lb = g.bestLabel;
        if (g.isTime) { v = v === 0 ? '—' : v + 'ms'; }
        return `<div class="profile-stat-card reveal" style="transition-delay:${i * .06}s"><div style="font-size:1.5rem;margin-bottom:4px">${g.icon}</div><div class="stat-value">${v}</div><div class="stat-label">${g.name}<br>${lb}</div></div>`;
      }).join('')}
    </div>

    <div style="text-align:center;margin-top:40px" class="reveal">
      <button class="auth-btn ghost" onclick="handleLogout()" style="max-width:200px;margin:0 auto;">🚪 Logout</button>
    </div>
  </section></div>`;
}

function selectAvatar(emoji) {
  Auth.setAvatar(emoji);
  SoundFX.play('correct');
  navigate();
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  Particles.init();
  initNavScroll();
  SoundFX.updateToggleBtn();
  UI.init();
  runLoader(() => { Auth.updateNavbar(); navigate(); DailyChallenge.startTimer(); });
  window.addEventListener('hashchange', navigate);
  document.getElementById('nav-hamburger').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
    document.getElementById('nav-hamburger').classList.toggle('active');
  });
});
