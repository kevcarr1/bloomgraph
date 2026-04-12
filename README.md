# BloomGraph

An embeddable radar/spider chart library. Zero dependencies, vanilla JavaScript, ~3KB.

![light and dark mode radar charts](https://via.placeholder.com/800x300?text=BloomGraph+Preview)

## Quick start

```html
<div id="chart"></div>
<script src="bloomgraph.js"></script>
<script>
  new BloomGraph('#chart');
</script>
```

## Installation

**Script tag** — copy `bloomgraph.js` into your project and include it:
```html
<script src="bloomgraph.js"></script>
```

**CommonJS / Node**
```js
const BloomGraph = require('./bloomgraph');
```

## Usage

### Default chart

Renders a fitness radar with 8 built-in axes and interactive sliders.

```html
<div id="chart"></div>
<script>
  new BloomGraph('#chart');
</script>
```

### Custom axes

```js
new BloomGraph('#chart', {
  title: 'Project health',
  axes: [
    { label: 'Velocity',    value: 80 },
    { label: 'Quality',     value: 65 },
    { label: 'Coverage',    value: 50 },
    { label: 'Docs',        value: 40 },
    { label: 'Reliability', value: 70 },
    { label: 'Security',    value: 90 },
  ],
});
```

### Custom accent color

```js
new BloomGraph('#chart', {
  accentColor: '#e05a2b',
});
```

### Listen for changes

```js
new BloomGraph('#chart', {
  onChange(values) {
    console.log(values); // { Velocity: 80, Quality: 65, ... }
  },
});
```

### Read-only chart with programmatic values

```js
const chart = new BloomGraph('#chart', {
  showControls: false,
  axes: [
    { label: 'Alice', value: 0 },
    { label: 'Bob',   value: 0 },
    { label: 'Carol', value: 0 },
  ],
});

chart.setValues({ Alice: 85, Bob: 72, Carol: 91 });
```

## API

### `new BloomGraph(container, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `string \| Element` | CSS selector or DOM element to render into |
| `options` | `object` | Configuration (see below) |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `axes` | `{label: string, value: number}[]` | 8 fitness axes | Axes and their initial values (0–100) |
| `title` | `string` | `'Growth radar'` | Label shown above the chart. Set to `''` to hide. |
| `showControls` | `boolean` | `true` | Show interactive range sliders below the chart |
| `theme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | Color scheme. `'auto'` follows the OS preference. |
| `accentColor` | `string` | `null` | Custom accent color (hex or rgb). Overrides the theme accent. |
| `onChange` | `(values: object) => void` | `null` | Called with a `{ label: value }` map whenever a slider changes |

### Methods

#### `chart.getValues()`

Returns a snapshot of current axis values as a plain object.

```js
chart.getValues(); // { Strength: 70, Speed: 80, ... }
```

#### `chart.setValues(map)`

Updates one or more axis values programmatically. Values are clamped to 0–100.

```js
chart.setValues({ Strength: 95, Speed: 60 });
```

#### `chart.destroy()`

Removes the chart from the DOM and cleans up all event listeners.

```js
chart.destroy();
```

## Framework usage

BloomGraph works in React, Vue, Angular, and SSR environments (Next.js, Nuxt, SvelteKit) with a small lifecycle wrapper. See [doc/framework-usage.md](doc/framework-usage.md) for copy-paste examples.

## Browser support

Any modern browser with SVG support (Chrome, Firefox, Safari, Edge).
