# Framework Usage

BloomGraph manages its own DOM node directly, so the integration pattern is the same across frameworks: mount after the DOM is ready, destroy on unmount.

## React

```jsx
import { useEffect, useRef } from 'react';

function RadarChart({ axes, title, showControls, accentColor, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    const chart = new BloomGraph(ref.current, {
      axes,
      title,
      showControls,
      accentColor,
      onChange,
    });
    return () => chart.destroy();
  }, []);

  return <div ref={ref} />;
}
```

Usage:

```jsx
<RadarChart
  title="My stats"
  axes={[
    { label: 'Speed',    value: 80 },
    { label: 'Strength', value: 60 },
  ]}
  onChange={(values) => console.log(values)}
/>
```

> If you need to drive values from outside the component (e.g. from state), call `chart.setValues()` inside a second `useEffect` that watches the relevant state.

```jsx
useEffect(() => {
  if (chartRef.current) chartRef.current.setValues(values);
}, [values]);
```

---

## Vue 3 (Composition API)

```vue
<template>
  <div ref="el" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  axes:         Array,
  title:        String,
  showControls: Boolean,
  accentColor:  String,
});

const emit = defineEmits(['change']);
const el = ref(null);
let chart;

onMounted(() => {
  chart = new BloomGraph(el.value, {
    ...props,
    onChange: (values) => emit('change', values),
  });
});

onBeforeUnmount(() => chart.destroy());
</script>
```

Usage:

```vue
<RadarChart
  title="My stats"
  :axes="[{ label: 'Speed', value: 80 }]"
  @change="handleChange"
/>
```

---

## Vue 2 (Options API)

```vue
<template>
  <div ref="el" />
</template>

<script>
export default {
  props: ['axes', 'title', 'showControls', 'accentColor'],
  mounted() {
    this.chart = new BloomGraph(this.$refs.el, {
      axes:         this.axes,
      title:        this.title,
      showControls: this.showControls,
      accentColor:  this.accentColor,
      onChange:     (values) => this.$emit('change', values),
    });
  },
  beforeDestroy() {
    this.chart.destroy();
  },
};
</script>
```

---

## Angular

```ts
import { Component, ElementRef, Input, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-radar-chart',
  template: '<div #chart></div>',
})
export class RadarChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chart') el!: ElementRef;
  @Input() axes?: { label: string; value: number }[];
  @Input() title?: string;
  @Input() showControls?: boolean;
  @Input() accentColor?: string;

  private chart: any;

  ngAfterViewInit() {
    this.chart = new BloomGraph(this.el.nativeElement, {
      axes:         this.axes,
      title:        this.title,
      showControls: this.showControls,
      accentColor:  this.accentColor,
    });
  }

  ngOnDestroy() {
    this.chart.destroy();
  }
}
```

Add `bloomgraph.js` to the `scripts` array in `angular.json`:

```json
"scripts": ["src/bloomgraph.js"]
```

---

## SSR environments (Next.js, Nuxt, SvelteKit)

BloomGraph uses browser-only APIs (`document`, `matchMedia`, SVG). It will throw during server-side rendering and must only run in the browser.

### Next.js (App Router)

Add `"use client"` and guard the import:

```tsx
'use client';

import { useEffect, useRef } from 'react';

export default function RadarChart(props) {
  const ref = useRef(null);

  useEffect(() => {
    let chart: any;
    import('../bloomgraph').then(({ default: BloomGraph }) => {
      chart = new BloomGraph(ref.current, props);
    });
    return () => chart?.destroy();
  }, []);

  return <div ref={ref} />;
}
```

Or disable SSR entirely for the component:

```tsx
import dynamic from 'next/dynamic';

const RadarChart = dynamic(() => import('./RadarChart'), { ssr: false });
```

### Nuxt 3

Use the `<ClientOnly>` wrapper or the `.client.vue` filename convention:

```vue
<!-- components/RadarChart.client.vue -->
<template>
  <div ref="el" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const el = ref(null);
let chart;

onMounted(async () => {
  const { default: BloomGraph } = await import('~/public/bloomgraph.js');
  chart = new BloomGraph(el.value, { /* options */ });
});

onBeforeUnmount(() => chart?.destroy());
</script>
```

### General guard

If you are unsure whether code will run in a browser or on a server, wrap any BloomGraph instantiation in a `typeof window` check:

```js
if (typeof window !== 'undefined') {
  new BloomGraph('#chart', options);
}
```
