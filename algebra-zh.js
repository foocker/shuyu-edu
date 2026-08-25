(function () {
  'use strict';

  const main = document.getElementById('reader-main');
  const lab = document.getElementById('math-lab');
  const labContent = document.getElementById('lab-content');
  const nav = document.getElementById('book-nav');
  const backdrop = document.getElementById('nav-backdrop');
  const sections = [...document.querySelectorAll('.book-section')];
  const links = [...document.querySelectorAll('[data-section-link]')];

  function factorize(value) {
    let n = Math.max(2, Math.floor(Number(value) || 2));
    const factors = [];
    for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) {
      let power = 0;
      while (n % p === 0) { n /= p; power += 1; }
      if (power) factors.push([p, power]);
    }
    if (n > 1) factors.push([n, 1]);
    return factors;
  }

  function factorText(value) {
    return factorize(value).map(([prime, power]) => power === 1 ? prime : `${prime}<sup>${power}</sup>`).join(' × ');
  }

  function choose(n, r) {
    r = Math.min(r, n - r);
    let result = 1;
    for (let i = 1; i <= r; i += 1) result = result * (n - r + i) / i;
    return Math.round(result);
  }

  function primesUpTo(limit) {
    const composite = Array(limit + 1).fill(false);
    for (let p = 2; p * p <= limit; p += 1) {
      if (!composite[p]) for (let n = p * p; n <= limit; n += p) composite[n] = true;
    }
    return Array.from({ length: limit - 1 }, (_, i) => i + 2).filter((n) => !composite[n]);
  }

  const labs = {
    'root-two'() {
      labContent.innerHTML = `
        <h3 class="lab-title">√2 不是有理数</h3>
        <svg class="lab-svg" viewBox="0 0 320 250" role="img" aria-label="单位正方形及其对角线">
          <rect x="58" y="24" width="200" height="200" fill="none" stroke="var(--green)" stroke-width="4"/>
          <path id="square-diagonal" d="M58 224 L258 24" stroke="var(--wine)" stroke-width="4"/>
          <text x="151" y="244" fill="var(--ink)" font-size="15">1</text>
          <text id="root-label" x="169" y="116" fill="var(--wine)" font-size="18" transform="rotate(-45 169 116)">√2</text>
        </svg>
        <div class="lab-controls">
          <button class="lab-button primary" id="toggle-diagonal" type="button">对角线</button>
          <button class="lab-button" id="toggle-square" type="button">正方形</button>
        </div>`;
      document.getElementById('toggle-diagonal').addEventListener('click', (event) => {
        const diagonal = document.getElementById('square-diagonal');
        const label = document.getElementById('root-label');
        const hidden = diagonal.style.display === 'none';
        diagonal.style.display = label.style.display = hidden ? '' : 'none';
        event.currentTarget.classList.toggle('primary', hidden);
      });
      document.getElementById('toggle-square').addEventListener('click', (event) => {
        const rect = labContent.querySelector('rect');
        const hidden = rect.style.display === 'none';
        rect.style.display = hidden ? '' : 'none';
        event.currentTarget.classList.toggle('primary', hidden);
      });
    },

    factor() {
      labContent.innerHTML = `
        <h3 class="lab-title">自然数的素分解</h3>
        <label class="lab-field">自然数<input id="factor-input" type="number" min="2" max="999999" value="360" inputmode="numeric"></label>
        <div class="lab-output" id="factor-output"></div>
        <div class="lab-controls"><button class="lab-button primary" id="factor-button" type="button">分解</button></div>`;
      const render = () => {
        const input = document.getElementById('factor-input');
        const value = Math.min(999999, Math.max(2, Math.floor(Number(input.value) || 2)));
        input.value = value;
        document.getElementById('factor-output').innerHTML = `<strong>${value}</strong> = ${factorText(value)}`;
      };
      document.getElementById('factor-button').addEventListener('click', render);
      document.getElementById('factor-input').addEventListener('input', render);
      render();
    },

    subset() {
      const elements = ['a', 'b', 'c', 'd', 'e'];
      const selected = new Set();
      labContent.innerHTML = `
        <h3 class="lab-title">集合与子集</h3>
        <div class="token-grid">${elements.map((x) => `<button type="button" data-token="${x}">${x}</button>`).join('')}</div>
        <div class="lab-output" id="subset-output"></div>`;
      const render = () => {
        const values = elements.filter((x) => selected.has(x));
        document.getElementById('subset-output').innerHTML = `
          S = {a, b, c, d, e}<br>
          n(S) = ${elements.length}<br>
          N = {${values.join(', ')}}<br>
          n(N) = <strong>${values.length}</strong><br>
          v(S) = n(U(S)) = 2<sup>n(S)</sup> = 2<sup>${elements.length}</sup> = <strong>${2 ** elements.length}</strong>`;
      };
      labContent.querySelectorAll('[data-token]').forEach((button) => button.addEventListener('click', () => {
        const value = button.dataset.token;
        if (selected.has(value)) selected.delete(value); else selected.add(value);
        button.classList.toggle('active', selected.has(value));
        render();
      }));
      render();
    },

    combination() {
      labContent.innerHTML = `
        <h3 class="lab-title">组合</h3>
        <label class="lab-field">n = <span id="n-value">6</span><input id="n-range" type="range" min="1" max="10" value="6"></label>
        <label class="lab-field">k = <span id="k-value">2</span><input id="k-range" type="range" min="0" max="6" value="2"></label>
        <div class="lab-output" id="combination-output"></div>
        <div class="pascal" id="pascal"></div>`;
      const render = () => {
        const n = Number(document.getElementById('n-range').value);
        const kRange = document.getElementById('k-range');
        kRange.max = n;
        if (Number(kRange.value) > n) kRange.value = n;
        const k = Number(kRange.value);
        document.getElementById('n-value').textContent = n;
        document.getElementById('k-value').textContent = k;
        document.getElementById('combination-output').innerHTML = `C<sub>${n}</sub><sup>${k}</sup> = <strong>${choose(n, k)}</strong>`;
        document.getElementById('pascal').innerHTML = Array.from({ length: n + 1 }, (_, row) =>
          `<div class="pascal-row">${Array.from({ length: row + 1 }, (_, col) => `<span class="pascal-cell ${row === n && col === k ? 'active' : ''}">${choose(row, col)}</span>`).join('')}</div>`
        ).join('');
      };
      labContent.querySelectorAll('input').forEach((input) => input.addEventListener('input', render));
      render();
    },

    'set-algebra'() {
      let mode = 'union';
      const universe = [1, 2, 3, 4, 5, 6, 7, 8];
      const setA = new Set([1, 2, 3, 4]);
      const setB = new Set([3, 4, 5, 6]);
      labContent.innerHTML = `
        <h3 class="lab-title">集代数</h3>
        <div class="lab-segment">
          <button class="active" type="button" data-mode="union">A ∪ B</button>
          <button type="button" data-mode="intersection">A ∩ B</button>
          <button type="button" data-mode="complement">A̅</button>
        </div>
        <svg class="lab-svg" viewBox="0 0 320 230" role="img" aria-label="集合运算维恩图">
          <rect x="18" y="18" width="284" height="194" fill="none" stroke="var(--line)" stroke-width="2"/>
          <circle id="venn-a" cx="125" cy="116" r="72" fill="var(--green)" fill-opacity=".32" stroke="var(--green)" stroke-width="3"/>
          <circle id="venn-b" cx="195" cy="116" r="72" fill="var(--wine)" fill-opacity=".32" stroke="var(--wine)" stroke-width="3"/>
          <text x="79" y="55" fill="var(--green)" font-size="18">A</text><text x="230" y="55" fill="var(--wine)" font-size="18">B</text>
        </svg>
        <div class="lab-output" id="set-output"></div>`;
      const render = () => {
        let result;
        if (mode === 'union') result = universe.filter((x) => setA.has(x) || setB.has(x));
        else if (mode === 'intersection') result = universe.filter((x) => setA.has(x) && setB.has(x));
        else result = universe.filter((x) => !setA.has(x));
        const a = document.getElementById('venn-a');
        const b = document.getElementById('venn-b');
        a.setAttribute('fill-opacity', mode === 'intersection' ? '.18' : mode === 'complement' ? '.04' : '.32');
        b.setAttribute('fill-opacity', mode === 'intersection' ? '.18' : mode === 'complement' ? '.04' : '.32');
        const label = mode === 'union' ? 'A ∪ B' : mode === 'intersection' ? 'A ∩ B' : 'A̅';
        document.getElementById('set-output').innerHTML = `${label} = {${result.join(', ')}}`;
      };
      labContent.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
        mode = button.dataset.mode;
        labContent.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('active', item === button));
        render();
      }));
      render();
    },

    probability() {
      let dieA = 5;
      let dieB = 4;
      const counts = Array.from({ length: 11 }, (_, i) => i < 6 ? i + 1 : 11 - i);
      labContent.innerHTML = `
        <h3 class="lab-title">概率的语言</h3>
        <div class="dice"><div class="die" id="die-a">5</div><div class="die" id="die-b">4</div></div>
        <div class="lab-output" id="dice-output"></div>
        <div class="bars">${counts.map((count, i) => `<div class="bar" data-sum="${i + 2}" style="--height:${count / 6 * 100}%"><span>${i + 2}</span></div>`).join('')}</div>
        <div class="lab-controls"><button class="lab-button primary" id="roll-dice" type="button">投掷两次</button></div>`;
      const render = () => {
        const sum = dieA + dieB;
        document.getElementById('die-a').textContent = dieA;
        document.getElementById('die-b').textContent = dieB;
        document.getElementById('dice-output').innerHTML = `${dieA} + ${dieB} = <strong>${sum}</strong><br>p(N<sub>${sum}</sub>) = ${counts[sum - 2]}/36`;
        labContent.querySelectorAll('.bar').forEach((bar) => bar.classList.toggle('active', Number(bar.dataset.sum) === sum));
      };
      document.getElementById('roll-dice').addEventListener('click', () => {
        dieA = Math.floor(Math.random() * 6) + 1;
        dieB = Math.floor(Math.random() * 6) + 1;
        render();
      });
      render();
    },

    'euclid-primes'() {
      let count = 3;
      const firstPrimes = [2, 3, 5, 7, 11, 13];
      labContent.innerHTML = `
        <h3 class="lab-title">素数的个数是无限的</h3>
        <label class="lab-field">素数个数 = <span id="prime-count">3</span><input id="prime-count-range" type="range" min="1" max="6" value="3"></label>
        <div class="lab-output" id="euclid-output"></div>`;
      const render = () => {
        count = Number(document.getElementById('prime-count-range').value);
        const list = firstPrimes.slice(0, count);
        const product = list.reduce((a, b) => a * b, 1);
        const n = product + 1;
        document.getElementById('prime-count').textContent = count;
        document.getElementById('euclid-output').innerHTML = `p<sub>1</sub>, …, p<sub>n</sub> = ${list.join(', ')}<br>N = ${list.join(' × ')} + 1 = <strong>${n}</strong><br>${n} = ${factorText(n)}`;
      };
      document.getElementById('prime-count-range').addEventListener('input', render);
      render();
    },

    'prime-sieve'() {
      labContent.innerHTML = `
        <h3 class="lab-title">素数的分布</h3>
        <label class="lab-field">n = <span id="sieve-limit-label">100</span><input id="sieve-limit" type="range" min="20" max="200" step="10" value="100"></label>
        <div class="lab-output" id="sieve-output"></div>
        <div class="prime-grid" id="prime-grid"></div>`;
      const render = () => {
        const limit = Number(document.getElementById('sieve-limit').value);
        const primes = new Set(primesUpTo(limit));
        document.getElementById('sieve-limit-label').textContent = limit;
        document.getElementById('sieve-output').innerHTML = `π(${limit}) = <strong>${primes.size}</strong><br>π(${limit})/${limit} = ${(primes.size / limit).toFixed(3)}`;
        document.getElementById('prime-grid').innerHTML = Array.from({ length: limit }, (_, i) => {
          const n = i + 1;
          return `<span class="prime-cell ${primes.has(n) ? 'prime' : n > 1 ? 'crossed' : ''}">${n}</span>`;
        }).join('');
      };
      document.getElementById('sieve-limit').addEventListener('input', render);
      render();
    }
  };

  function activateSection(section) {
    if (!section) return;
    links.forEach((link) => link.classList.toggle('active', link.dataset.sectionLink === section.id));
    const renderLab = labs[section.dataset.tool];
    if (renderLab && labContent.dataset.tool !== section.dataset.tool) {
      labContent.dataset.tool = section.dataset.tool;
      renderLab();
    }
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activateSection(visible.target);
  }, { root: main, rootMargin: '-15% 0px -65%', threshold: [0, .1, .4] });
  sections.forEach((section) => observer.observe(section));

  main.addEventListener('scroll', () => {
    const max = main.scrollHeight - main.clientHeight;
    document.getElementById('progress-bar').style.width = `${max > 0 ? main.scrollTop / max * 100 : 0}%`;
  }, { passive: true });

  function closeNav() { nav.classList.remove('open'); backdrop.classList.remove('open'); }
  function scrollToSection(id, behavior = 'smooth') {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
    if (behavior === 'auto') {
      const previous = main.style.scrollBehavior;
      main.style.scrollBehavior = 'auto';
      main.scrollTop = top;
      main.style.scrollBehavior = previous;
    } else {
      main.scrollTo({ top, behavior });
    }
  }
  document.getElementById('menu-button').addEventListener('click', () => {
    nav.classList.toggle('open'); backdrop.classList.toggle('open', nav.classList.contains('open'));
  });
  backdrop.addEventListener('click', closeNav);
  document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
    const id = link.getAttribute('href').slice(1);
    if (!document.getElementById(id)) return;
    event.preventDefault();
    history.pushState(null, '', `#${id}`);
    closeNav();
    scrollToSection(id);
  }));

  document.getElementById('theme-button').addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('shuyu-algebra-theme', next);
  });
  document.documentElement.dataset.theme = localStorage.getItem('shuyu-algebra-theme') || 'light';

  document.getElementById('lab-tab').addEventListener('click', () => lab.classList.add('open'));
  document.getElementById('lab-close').addEventListener('click', () => lab.classList.remove('open'));

  activateSection(sections[0]);
  const restoreHash = () => {
    if (window.location.hash) scrollToSection(window.location.hash.slice(1), 'auto');
  };
  restoreHash();
  requestAnimationFrame(() => requestAnimationFrame(restoreHash));
  setTimeout(restoreHash, 100);
  window.addEventListener('load', () => {
    restoreHash();
    setTimeout(restoreHash, 100);
  }, { once: true });
  window.addEventListener('hashchange', () => scrollToSection(window.location.hash.slice(1), 'auto'));
})();
