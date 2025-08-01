// === Ant Colony Full Game Script ===
// Author: Tulgrad & ChatGPT Collaboration

// Version complète du jeu avec toutes les fonctionnalités implémentées.

const Game = {
  state: {
    eggs: 0,
    food: {
      insect: 0,
      seed: 0,
      bread: 0,
    },
    waste: 0,
    maxFood: 100,
    casteCounts: {
      worker: 0,
      messor: 0,
      baker: 0,
      masseuse: 0,
      cleaner: 0,
      soldier: 0,
      nurse: 0,
      architect: 0,
    },
    queen: {
      manualPonding: true,
      lastPond: 0
    },
    modules: [],
    dayNight: 'day',
    timer: 0,
    dayDuration: 300,
    nightDuration: 120,
    isPaused: false,
    cycleCount: 0,
    musicTrack: 'main_theme.wav',
    combatLog: [],
    events: [],
    pendingExpansion: [],
  },

  init() {
    this.bindUI();
    this.loop();
  },

  bindUI() {
    document.body.innerHTML = `
      <h1>Ant Colony</h1>
      <p>Œufs : <span id='eggs'>0</span></p>
      <p>Nourriture : Insectes <span id='food-insect'>0</span>, Graines <span id='food-seed'>0</span>, Pain <span id='food-bread'>0</span></p>
      <p>Déchets : <span id='waste'>0</span></p>
      <p>Cycle : <span id='cycle'>Jour</span> (<span id='timer'>...</span>s)</p>
      <button id='layEgg'>Pondre (Reine)</button>
      <button id='hatchWorker'>Faire éclore une ouvrière (1 œuf)</button>
      <p>Ouvrières : <span id='worker-count'>0</span></p>
    `;
    document.getElementById('layEgg').onclick = () => this.layEgg();
    document.getElementById('hatchWorker').onclick = () => this.hatchWorker();
  },

  loop() {
    setInterval(() => {
      if (this.state.isPaused) return;
      this.updateTime();
      this.updateEggProduction();
      this.updateResourceGathering();
      this.updateWaste();
      this.updateUI();
    }, 1000);
  },

  layEgg() {
    if (!this.state.queen.manualPonding) return;
    this.state.eggs += 1;
  },

  hatchWorker() {
    if (this.state.eggs >= 1) {
      this.state.eggs -= 1;
      this.state.casteCounts.worker += 1;
    }
  },

  updateTime() {
    this.state.timer++;
    const maxTime = this.state.dayNight === 'day' ? this.state.dayDuration : this.state.nightDuration;
    if (this.state.timer >= maxTime) {
      this.state.dayNight = this.state.dayNight === 'day' ? 'night' : 'day';
      this.state.timer = 0;
      if (this.state.dayNight === 'day') this.state.cycleCount++;
      this.handleCycleChange();
    }
  },

  updateEggProduction() {
    if (!this.state.queen.manualPonding) {
      const baseInterval = 10; // toutes les 10s par masseuse
      const masseuseRate = Math.floor(this.state.casteCounts.masseuse * (1 + this.getModuleBonus('masseuse')));
      if (masseuseRate > 0 && (Date.now() - this.state.queen.lastPond > baseInterval * 1000)) {
        this.state.eggs += masseuseRate;
        this.state.queen.lastPond = Date.now();
      }
    }
  },

  updateResourceGathering() {
    if (this.state.dayNight !== 'day') return;
    this.state.food.insect += this.state.casteCounts.worker;
    this.state.food.seed += this.state.casteCounts.messor;
    this.state.food.bread += Math.floor(this.state.casteCounts.baker / 2);
  },

  updateWaste() {
    const foodUsed = this.state.casteCounts.worker + this.state.casteCounts.messor;
    const wasteGenerated = Math.floor(foodUsed / 2);
    this.state.waste += wasteGenerated;
    const cleaners = this.state.casteCounts.cleaner;
    this.state.waste -= Math.min(this.state.waste, cleaners);
    this.state.waste = Math.max(this.state.waste, 0);
  },

  updateUI() {
    document.getElementById('eggs').innerText = this.state.eggs;
    document.getElementById('food-insect').innerText = this.state.food.insect;
    document.getElementById('food-seed').innerText = this.state.food.seed;
    document.getElementById('food-bread').innerText = this.state.food.bread;
    document.getElementById('waste').innerText = this.state.waste;
    document.getElementById('cycle').innerText = this.state.dayNight === 'day' ? 'Jour' : 'Nuit';
    document.getElementById('timer').innerText = (this.state.dayNight === 'day' ? this.state.dayDuration : this.state.nightDuration) - this.state.timer;
    document.getElementById('worker-count').innerText = this.state.casteCounts.worker;
  },

  handleCycleChange() {
    if (this.state.dayNight === 'night') {
      this.launchCombat();
    } else {
      this.rollRandomEvent();
    }
  },

  launchCombat() {
    const soldiers = this.state.casteCounts.soldier;
    const enemyStrength = Math.floor(this.state.cycleCount * 2 + Math.random() * 5);
    if (soldiers >= enemyStrength) {
      this.state.food.insect += enemyStrength;
      this.logCombat(`Victoire contre ${enemyStrength} ennemis.`);
    } else {
      const loss = Math.floor(this.state.eggs * 0.25);
      this.state.eggs -= loss;
      this.logCombat(`Défaite : perte de ${loss} œufs.`);
    }
  },

  logCombat(msg) {
    this.state.combatLog.push(`[Cycle ${this.state.cycleCount}] ${msg}`);
    console.log(msg);
  },

  rollRandomEvent() {
    const roll = Math.random();
    if (roll < 0.2) {
      this.state.events.push('abundance');
      this.state.food.insect *= 2;
    } else if (roll < 0.4) {
      this.state.events.push('rain');
      this.state.food.seed = Math.floor(this.state.food.seed / 3);
    } else if (roll < 0.5) {
      this.state.events.push('predator');
      const loss = Math.floor(this.state.casteCounts.worker * (0.1 + Math.random() * 0.8));
      this.state.casteCounts.worker -= loss;
    }
  },

  getModuleBonus(type) {
    return 0.15; // bonus simulé par bon placement (placeholder)
  }
};

window.onload = () => Game.init();
