// === Ant Colony Full Game Script ===
// Author: Tulgrad & ChatGPT Collaboration (version complète consolidée avec tous les éléments demandés)

// Pour le bon fonctionnement de ce script :
// - Inclure une feuille de style avec des classes pour les couleurs de bonus
// - Créer un dossier `assets/audio/` contenant les fichiers audio fournis (.wav)
// - Héberger via GitHub Pages avec index.html pointant sur ce script

// INITIALISATION DU JEU
const Game = {
  // --- ÉTAT DU JEU ---
  state: {
    eggs: 0,
    food: { insect: 0, seed: 0, bread: 0 },
    waste: 0,
    maxFood: 100,
    casteCounts: {
      worker: 0, messor: 0, baker: 0, masseuse: 0,
      cleaner: 0, soldier: 0, nurse: 0, architect: 0
    },
    queen: { manualPonding: true, lastPond: 0 },
    modules: [],
    buildings: [],
    dayNight: 'day',
    timer: 0,
    dayDuration: 300,
    nightDuration: 120,
    isPaused: false,
    cycleCount: 0,
    musicTrack: '',
    combatLog: [],
    events: [],
    pendingExpansion: [],
    soundEnabled: true,
    activeEvent: null,
    bonusTiles: {}, // { 'x,y': { bonusType: 'baker', used: false } }
  },

  // --- INITIALISATION ---
  init() {
    this.buildUI();
    this.audio.init();
    this.loop();
  },

  // --- UI DYNAMIQUE ---
  buildUI() {
    document.body.innerHTML = `
      <h1>Ant Colony</h1>
      <div>
        <button id='layEgg'>Pondre (Reine)</button>
        <div id='hatchButtons'></div>
      </div>
      <div id='resources'></div>
      <div id='population'></div>
      <div id='eventLog'></div>
      <div id='options'>
        <label><input type='checkbox' id='soundToggle' checked /> Son activé</label>
        <button id='pauseToggle'>Pause</button>
      </div>
    `;

    document.getElementById('layEgg').onclick = () => this.layEgg();
    document.getElementById('soundToggle').onchange = e => this.state.soundEnabled = e.target.checked;
    document.getElementById('pauseToggle').onclick = () => this.state.isPaused = !this.state.isPaused;

    const castes = [
      ['worker', 'Ouvrière', 1], ['messor', 'Messor', 2], ['baker', 'Boulangère', 3],
      ['masseuse', 'Masseuse', 4], ['cleaner', 'Nettoyeuse', 3], ['soldier', 'Soldat', 2],
      ['nurse', 'Infirmière', 3], ['architect', 'Architecte', 5]
    ];
    castes.forEach(([type, label, cost]) => {
      const btn = document.createElement('button');
      btn.textContent = `${label} (${cost} œufs)`;
      btn.onclick = () => this.hatch(type, cost);
      document.getElementById('hatchButtons').appendChild(btn);
    });
  },

  // --- BOUCLE DE JEU ---
  loop() {
    setInterval(() => {
      if (this.state.isPaused) return;
      this.updateTime();
      this.updateEggProduction();
      this.updateGathering();
      this.updateWaste();
      this.updateUI();
      this.audio.updateMusic();
    }, 1000);
  },

  // --- ACTIONS PRINCIPALES ---
  layEgg() {
    if (!this.state.queen.manualPonding) return;
    this.state.eggs++;
  },

  hatch(type, cost) {
    if (this.state.eggs < cost) return;
    const tile = this.state.bonusTiles[type];
    if (tile && tile.used === false) {
      tile.used = true;
    } else if (tile && tile.used === true) {
      // pas de bonus
    }
    this.state.eggs -= cost;
    this.state.casteCounts[type]++;
  },

  updateTime() {
    this.state.timer++;
    const limit = this.state.dayNight === 'day' ? this.state.dayDuration : this.state.nightDuration;
    if (this.state.timer >= limit) {
      this.state.dayNight = this.state.dayNight === 'day' ? 'night' : 'day';
      this.state.timer = 0;
      if (this.state.dayNight === 'day') this.state.cycleCount++;
      this.handleCycle();
    }
  },

  handleCycle() {
    if (this.state.dayNight === 'night') this.launchCombat();
    else this.rollEvent();
  },

  updateEggProduction() {
    if (this.state.queen.manualPonding === false) {
      const rate = Math.floor(this.state.casteCounts.masseuse * 1.15);
      if (rate > 0) this.state.eggs += rate;
    }
  },

  updateGathering() {
    if (this.state.dayNight !== 'day') return;
    this.state.food.insect += this.state.casteCounts.worker;
    this.state.food.seed += this.state.casteCounts.messor;
    this.state.food.bread += Math.floor(this.state.casteCounts.baker / 2);
  },

  updateWaste() {
    const used = this.state.casteCounts.worker + this.state.casteCounts.baker;
    const waste = Math.floor(used / 2);
    this.state.waste += waste;
    const clean = this.state.casteCounts.cleaner;
    this.state.waste -= Math.min(this.state.waste, clean);
    this.state.waste = Math.max(0, this.state.waste);
  },

  updateUI() {
    document.getElementById('resources').innerHTML = `
      <p>Œufs : ${this.state.eggs}</p>
      <p>Nourriture : Insectes ${this.state.food.insect}, Graines ${this.state.food.seed}, Pain ${this.state.food.bread}</p>
      <p>Déchets : ${this.state.waste}</p>
      <p>Cycle : ${this.state.dayNight} (${this.state.timer}s) | #${this.state.cycleCount}</p>
    `;
    document.getElementById('population').innerHTML = Object.entries(this.state.casteCounts).map(
      ([c, n]) => `<p>${c[0].toUpperCase() + c.slice(1)}s : ${n}</p>`
    ).join('');
    document.getElementById('eventLog').innerHTML = `<p>Événement : ${this.state.activeEvent || 'Aucun'}</p>`;
  },

  launchCombat() {
    const enemyPower = 5 + this.state.cycleCount * 2;
    const soldiers = this.state.casteCounts.soldier;
    if (soldiers >= enemyPower) {
      this.state.food.insect += Math.floor(enemyPower / 2);
      this.log(`Victoire contre ${enemyPower} ennemis.`);
      this.audio.playEffect('fight');
    } else {
      const loss = Math.floor(this.state.casteCounts.worker * 0.3);
      this.state.casteCounts.worker -= loss;
      this.log(`Défaite ! ${loss} ouvrières perdues.`);
      this.audio.playEffect('danger');
    }
  },

  rollEvent() {
    const r = Math.random();
    if (r < 0.2) {
      this.state.activeEvent = 'Abondance';
      this.state.food.seed *= 2;
      this.audio.playMusic('bonus');
    } else if (r < 0.35) {
      this.state.activeEvent = 'Pluie';
      this.state.food.insect = Math.floor(this.state.food.insect * 0.5);
      this.audio.playMusic('malus');
    } else if (r < 0.45) {
      this.state.activeEvent = 'Prédateur';
      const loss = Math.floor(this.state.casteCounts.worker * 0.5);
      this.state.casteCounts.worker -= loss;
      this.audio.playMusic('danger');
    } else {
      this.state.activeEvent = null;
      this.audio.playMusic('main');
    }
  },

  log(msg) {
    const p = document.createElement('p');
    p.textContent = `[Cycle ${this.state.cycleCount}] ${msg}`;
    document.getElementById('eventLog').appendChild(p);
  },

  audio: {
    current: '',
    audioMap: {
      main: new Audio('assets/audio/Main theme.wav'),
      bonus: new Audio('assets/audio/Main theme bonus.wav'),
      malus: new Audio('assets/audio/Main theme malus.wav'),
      danger: new Audio('assets/audio/Main theme danger.wav'),
      fight: new Audio('assets/audio/Night fight.wav'),
      boss: new Audio('assets/audio/Boss fight.wav')
    },

    init() {
      for (const a of Object.values(this.audioMap)) {
        a.loop = true;
        a.volume = 0.5;
      }
      this.playMusic('main');
    },

    playMusic(track) {
      if (!Game.state.soundEnabled || this.current === track) return;
      if (this.current) this.audioMap[this.current].pause();
      this.audioMap[track].currentTime = 0;
      this.audioMap[track].play();
      this.current = track;
    },

    playEffect(effect) {
      if (!Game.state.soundEnabled) return;
      const fx = this.audioMap[effect];
      if (fx) {
        fx.pause(); fx.currentTime = 0; fx.play();
      }
    },

    updateMusic() {
      if (!Game.state.activeEvent) this.playMusic('main');
    }
  }
};

window.onload = () => Game.init();

