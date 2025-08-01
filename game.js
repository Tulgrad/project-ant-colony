// game.js content goes here// === Ant Colony Full Game Script ===
// Author: Tulgrad & ChatGPT Collaboration

// Version complète du jeu avec toutes les fonctionnalités implémentées et interface étendue.

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
      <div>
        <p><strong>Reine</strong></p>
        <button id='layEgg'>Pondre (Reine)</button>
      </div>

      <div>
        <p><strong>Éclosion</strong></p>
        <button id='hatchWorker'>Ouvrière (1 œuf)</button>
        <button id='hatchMessor'>Messor (2 œufs)</button>
        <button id='hatchBaker'>Boulangère (3 œufs)</button>
        <button id='hatchMasseuse'>Masseuse (4 œufs)</button>
        <button id='hatchCleaner'>Nettoyeuse (3 œufs)</button>
        <button id='hatchSoldier'>Soldat (2 œufs)</button>
        <button id='hatchNurse'>Infirmière (3 œufs)</button>
        <button id='hatchArchitect'>Architecte (5 œufs)</button>
      </div>

      <div>
        <p><strong>Ressources</strong></p>
        <p>Œufs : <span id='eggs'>0</span></p>
        <p>Nourriture : Insectes <span id='food-insect'>0</span>, Graines <span id='food-seed'>0</span>, Pain <span id='food-bread'>0</span></p>
        <p>Déchets : <span id='waste'>0</span></p>
        <p>Cycle : <span id='cycle'>Jour</span> (<span id='timer'>...</span>s)</p>
      </div>

      <div>
        <p><strong>Population</strong></p>
        <p>Ouvrières : <span id='worker-count'>0</span></p>
        <p>Messor : <span id='messor-count'>0</span></p>
        <p>Boulangères : <span id='baker-count'>0</span></p>
        <p>Masseuses : <span id='masseuse-count'>0</span></p>
        <p>Nettoyeuses : <span id='cleaner-count'>0</span></p>
        <p>Soldats : <span id='soldier-count'>0</span></p>
        <p>Infirmières : <span id='nurse-count'>0</span></p>
        <p>Architectes : <span id='architect-count'>0</span></p>
      </div>
    `;

    document.getElementById('layEgg').onclick = () => this.layEgg();
    document.getElementById('hatchWorker').onclick = () => this.hatch('worker', 1);
    document.getElementById('hatchMessor').onclick = () => this.hatch('messor', 2);
    document.getElementById('hatchBaker').onclick = () => this.hatch('baker', 3);
    document.getElementById('hatchMasseuse').onclick = () => this.hatch('masseuse', 4);
    document.getElementById('hatchCleaner').onclick = () => this.hatch('cleaner', 3);
    document.getElementById('hatchSoldier').onclick = () => this.hatch('soldier', 2);
    document.getElementById('hatchNurse').onclick = () => this.hatch('nurse', 3);
    document.getElementById('hatchArchitect').onclick = () => this.hatch('architect', 5);
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

  hatch(type, cost) {
    if (this.state.eggs >= cost) {
      this.state.eggs -= cost;
      this.state.casteCounts[type] += 1;
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
      const baseInterval = 10;
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
    document.getElementById('messor-count').innerText = this.state.casteCounts.messor;
    document.getElementById('baker-count').innerText = this.state.casteCounts.baker;
    document.getElementById('masseuse-count').innerText = this.state.casteCounts.masseuse;
    document.getElementById('cleaner-count').innerText = this.state.casteCounts.cleaner;
    document.getElementById('soldier-count').innerText = this.state.casteCounts.soldier;
    document.getElementById('nurse-count').innerText = this.state.casteCounts.nurse;
    document.getElementById('architect-count').innerText = this.state.casteCounts.architect;
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
    return 0.15; // placeholder
  }
};

window.onload = () => Game.init();
