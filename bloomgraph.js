/*!
 * BloomGraph — embeddable radar/spider chart
 * Usage: new BloomGraph(container, options)
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BloomGraph = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const CSS_ID = 'bloomgraph-styles';
  const CSS = `
.bg-wrap { box-sizing: border-box; padding: 1.5rem 0; }
.bg-wrap *, .bg-wrap *::before, .bg-wrap *::after { box-sizing: inherit; }
.bg-title { display: block; font-size: 13px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 1.5rem; padding: 0; }
.bg-controls { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin: 1.5rem 0 0; padding: 0; list-style: none; }
.bg-stat { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; }
.bg-stat-label { display: block; font-size: 12px; color: #888; margin: 0; padding: 0; }
.bg-stat-row { display: flex; align-items: center; gap: 8px; margin: 0; padding: 0; }
.bg-stat-row input[type=range] { flex: 1; min-width: 0; margin: 0; padding: 0; }
.bg-stat-val { display: inline-block; font-size: 13px; font-weight: 500; min-width: 28px; text-align: right; margin: 0; padding: 0; }
.bg-stat-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin: 0; padding: 0; }
`;

  function injectStyles() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function resolveContainer(target) {
    if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (!el) throw new Error(`BloomGraph: no element found for selector "${target}"`);
      return el;
    }
    if (target instanceof Element) return target;
    throw new Error('BloomGraph: container must be a CSS selector string or Element');
  }

  class BloomGraph {
    /**
     * @param {string|Element} container  CSS selector or DOM element
     * @param {object}         options
     * @param {Array<{label:string, value:number}>} [options.axes]
     * @param {string}  [options.title='Growth radar']
     * @param {boolean} [options.showControls=true]
     * @param {'auto'|'light'|'dark'} [options.theme='auto']
     * @param {string}  [options.accentColor]   custom hex/rgb accent (overrides theme)
     * @param {function} [options.onChange]     called with value map on every change
     */
    constructor(container, options = {}) {
      injectStyles();

      this._el = resolveContainer(container);
      this._axes = (options.axes || [
        { label: 'Strength',    value: 70 },
        { label: 'Endurance',   value: 55 },
        { label: 'Speed',       value: 80 },
        { label: 'Flexibility', value: 40 },
        { label: 'Focus',       value: 65 },
        { label: 'Recovery',    value: 50 },
        { label: 'Technique',   value: 75 },
        { label: 'Balance',     value: 60 },
      ]).map(a => ({ label: a.label, value: a.value })); // clone

      this._title        = options.title ?? 'Growth radar';
      this._showControls = options.showControls ?? true;
      this._theme        = options.theme ?? 'auto';
      this._accentColor  = options.accentColor ?? null;
      this._onChange     = options.onChange ?? null;
      this._darkMQ       = matchMedia('(prefers-color-scheme: dark)');
      this._mqListener   = () => { this._resolveTheme(); this._render(); };

      this._resolveTheme();
      this._build();
      this._render();
      if (this._showControls) this._buildControls();

      if (this._theme === 'auto') {
        this._darkMQ.addEventListener('change', this._mqListener);
      }
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /** Return a snapshot of current values as { label: value } */
    getValues() {
      return Object.fromEntries(this._axes.map(a => [a.label, a.value]));
    }

    /**
     * Merge new values into the chart.
     * @param {Object<string,number>} map  e.g. { Strength: 90, Speed: 60 }
     */
    setValues(map) {
      for (const ax of this._axes) {
        if (map[ax.label] !== undefined) {
          ax.value = Math.max(0, Math.min(100, +map[ax.label]));
        }
      }
      this._syncSliders();
      this._render();
    }

    /** Remove the chart from the DOM and clean up listeners */
    destroy() {
      this._darkMQ.removeEventListener('change', this._mqListener);
      this._el.innerHTML = '';
    }

    // ── Private ─────────────────────────────────────────────────────────────

    _resolveTheme() {
      const dark = this._theme === 'dark' ||
                   (this._theme === 'auto' && this._darkMQ.matches);

      if (this._accentColor) {
        this._accentFill   = this._accentColor + '26'; // ~15% opacity
        this._accentStroke = this._accentColor;
      } else {
        this._accentFill   = dark ? 'rgba(95,120,210,0.22)' : 'rgba(83,74,183,0.15)';
        this._accentStroke = dark ? '#8b9ae8' : '#534AB7';
      }
      this._gridColor  = dark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.08)';
      this._axisColor  = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
      this._textColor  = dark ? '#a0a0a0' : '#888780';
      this._dotBg      = dark ? '#1a1a1a' : '#fff';
    }

    _build() {
      this._el.innerHTML = `
        <div class="bg-wrap">
          ${this._title ? `<div class="bg-title">${this._title}</div>` : ''}
          <svg class="bg-svg" viewBox="0 0 400 360" width="100%"
               style="display:block; max-width:420px; margin:0 auto;"></svg>
          ${this._showControls ? '<div class="bg-controls"></div>' : ''}
        </div>`;
      this._svg = this._el.querySelector('.bg-svg');
    }

    _angle(i) {
      return (2 * Math.PI * i / this._axes.length) - Math.PI / 2;
    }

    _polarToXY(r, i) {
      const a = this._angle(i);
      return [200 + r * Math.cos(a), 185 + r * Math.sin(a)];
    }

    _polygonPoints(radius) {
      return Array.from({ length: this._axes.length }, (_, i) =>
        this._polarToXY(radius, i).join(',')
      ).join(' ');
    }

    _render() {
      const svg = this._svg;
      svg.innerHTML = '';
      const N = this._axes.length;
      const R = 130;
      const LEVELS = 5;
      const ns = 'http://www.w3.org/2000/svg';
      const mk = (tag, attrs) => {
        const el = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
      };

      // Grid rings
      for (let l = 1; l <= LEVELS; l++) {
        svg.appendChild(mk('polygon', {
          points: this._polygonPoints((l / LEVELS) * R),
          fill: 'none', stroke: this._gridColor, 'stroke-width': '0.8'
        }));
      }

      // Axis spokes
      for (let i = 0; i < N; i++) {
        const [x, y] = this._polarToXY(R, i);
        svg.appendChild(mk('line', {
          x1: 200, y1: 185, x2: x, y2: y,
          stroke: this._axisColor, 'stroke-width': '0.8'
        }));
      }

      // Filled area
      const pts = this._axes.map((ax, i) =>
        this._polarToXY((ax.value / 100) * R, i).join(',')
      ).join(' ');
      svg.appendChild(mk('polygon', {
        points: pts, fill: this._accentFill,
        stroke: this._accentStroke, 'stroke-width': '2', 'stroke-linejoin': 'round'
      }));

      // Vertex dots
      for (let i = 0; i < N; i++) {
        const [x, y] = this._polarToXY((this._axes[i].value / 100) * R, i);
        svg.appendChild(mk('circle', {
          cx: x, cy: y, r: '4',
          fill: this._accentStroke, stroke: this._dotBg, 'stroke-width': '1.5'
        }));
      }

      // Labels
      for (let i = 0; i < N; i++) {
        const LABEL_PAD = 18;
        const [x, y] = this._polarToXY(R + LABEL_PAD, i);
        let anchor = 'middle';
        if (x < 190) anchor = 'end';
        else if (x > 210) anchor = 'start';
        const t = mk('text', {
          x, y, 'text-anchor': anchor, 'dominant-baseline': 'middle',
          'font-size': '11.5', 'font-family': 'sans-serif', fill: this._textColor
        });
        t.textContent = this._axes[i].label;
        svg.appendChild(t);
      }
    }

    _buildControls() {
      const container = this._el.querySelector('.bg-controls');
      if (!container) return;
      container.innerHTML = '';
      this._axes.forEach((ax, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'bg-stat';
        wrap.innerHTML = `
          <div class="bg-stat-label">${ax.label}</div>
          <div class="bg-stat-row">
            <span class="bg-stat-dot" style="background:${this._accentStroke}"></span>
            <input type="range" min="0" max="100" step="1" value="${ax.value}" data-idx="${i}">
            <span class="bg-stat-val" data-val="${i}">${ax.value}</span>
          </div>`;
        wrap.querySelector('input').addEventListener('input', e => {
          const idx = +e.target.dataset.idx;
          this._axes[idx].value = +e.target.value;
          wrap.querySelector(`[data-val="${idx}"]`).textContent = this._axes[idx].value;
          this._render();
          if (this._onChange) this._onChange(this.getValues());
        });
        container.appendChild(wrap);
      });
    }

    _syncSliders() {
      this._axes.forEach((ax, i) => {
        const input = this._el.querySelector(`input[data-idx="${i}"]`);
        const val   = this._el.querySelector(`[data-val="${i}"]`);
        if (input) input.value = ax.value;
        if (val)   val.textContent = ax.value;
      });
    }
  }

  return BloomGraph;
}));
