# React Liquid Logo

A React component that creates beautiful animated liquid effects on logos using WebGL shaders. The component applies realistic fluid dynamics, refraction, and edge effects to create stunning visual animations. Based on [Inspira UI](https://inspira-ui.com/docs/components/visualization/liquid-logo)

## Features

- 🎨 **WebGL-powered rendering** for smooth animations
- 🌊 **Realistic liquid effects** with customizable parameters
- 📱 **Responsive design** that adapts to different screen sizes
- 🎛️ **Interactive controls** for real-time parameter adjustment
- 🖼️ **Multiple format support** (SVG, PNG, JPG)
- ⚡ **Performance optimized** with efficient shader programs
- 🎯 **TypeScript support** with full type definitions


### Requirements

- **React 18+**
- **WebGL2 support** (most modern browsers)
- **TypeScript** (optional, but recommended)

## Quick Start

```tsx
import { LiquidLogo } from 'react-liquid-logo'

function App() {
  return (
    <div className="w-full max-w-2xl aspect-video">
      <LiquidLogo
        imageUrl="/path/to/your/logo.svg"
        patternScale={2}
        refraction={0.015}
        edge={0.2}
        patternBlur={0.005}
        liquid={0.07}
        speed={0.1}
      />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | **Required** | Path to the logo image (SVG, PNG, JPG) |
| `className` | `string` | `undefined` | Additional CSS classes |
| `patternScale` | `number` | `2` | Controls the scale of the liquid pattern |
| `refraction` | `number` | `0.015` | Light refraction intensity (0-0.1) |
| `edge` | `number` | `0.4` | Edge definition strength (0-1) |
| `patternBlur` | `number` | `0.005` | Blur amount for the liquid pattern |
| `liquid` | `number` | `0.07` | Liquid viscosity/density |
| `speed` | `number` | `0.3` | Animation speed multiplier |
| `showProcessing` | `boolean` | `true` | Show loading indicator while processing |

## Advanced Usage

### Custom Styling

```tsx
<LiquidLogo
  imageUrl="/logo.svg"
  className="rounded-lg shadow-lg"
  style={{
    filter: 'brightness(1.1)',
    transform: 'scale(0.9)'
  }}
/>
```

### Interactive Controls

Create interactive controls like in the demo:

```tsx
const [settings, setSettings] = useState({
  patternScale: 2,
  refraction: 0.015,
  edge: 0.2,
  patternBlur: 0.005,
  liquid: 0.07,
  speed: 0.1
})

return (
  <div className="flex gap-8">
    <div className="w-full max-w-2xl aspect-video">
      <LiquidLogo
        imageUrl="/logo.svg"
        {...settings}
      />
    </div>

    <div className="space-y-4">
      <Slider
        value={[settings.patternScale]}
        onValueChange={([v]) => setSettings(s => ({ ...s, patternScale: v }))}
        min={0.1}
        max={10}
        step={0.1}
      />
      {/* More sliders for other properties */}
    </div>
  </div>
)
```

### Responsive Layout

The component works well with responsive designs:

```tsx
<div className="flex flex-col md:flex-row gap-8">
  <div className="w-full max-w-2xl aspect-video">
    <LiquidLogo imageUrl="/logo.svg" />
  </div>
  {/* Controls below on mobile, beside on desktop */}
</div>
```

## Parameter Guide

### Visual Effects

- **`patternScale`**: Higher values create more detailed liquid patterns
- **`refraction`**: Controls light bending through the liquid surface
- **`edge`**: Defines how sharply the liquid edges are rendered
- **`patternBlur`**: Adds softness to the liquid animation
- **`liquid`**: Controls the fluidity and movement characteristics

### Animation

- **`speed`**: Multiplier for animation playback speed (0 = paused)

### Performance

- **`showProcessing`**: Toggle the loading indicator during image processing

## Browser Support

- ✅ Chrome 51+
- ✅ Firefox 45+
- ✅ Safari 10+
- ✅ Edge 79+
- ❌ Internet Explorer (WebGL2 not supported)

## Examples

### Basic Logo Animation

```tsx
import { LiquidLogo } from 'react-liquid-logo'

export default function LogoShowcase() {
  return (
    <LiquidLogo
      imageUrl="/company-logo.svg"
      patternScale={1.5}
      refraction={0.02}
      edge={0.3}
      liquid={0.05}
      speed={0.2}
    />
  )
}
```

### Dark Theme Adaptation

```tsx
<LiquidLogo
  imageUrl="/logo-dark.svg"
  className="dark:filter dark:invert"
  patternScale={2.5}
  refraction={0.01}
  edge={0.5}
/>
```

### Hero Section

```tsx
<section className="hero-section">
  <div className="container mx-auto px-4">
    <div className="flex flex-col lg:flex-row items-center gap-12">
      <div className="flex-1">
        <h1 className="text-5xl font-bold mb-6">Welcome</h1>
        <p className="text-xl text-gray-600 mb-8">Experience our brand in motion</p>
      </div>
      <div className="w-full max-w-lg aspect-square">
        <LiquidLogo
          imageUrl="/hero-logo.svg"
          patternScale={3}
          refraction={0.025}
          edge={0.2}
          liquid={0.08}
          speed={0.15}
        />
      </div>
    </div>
  </div>
</section>
```

## Troubleshooting

### Common Issues

1. **Component not rendering**: Ensure WebGL2 is supported in your browser
2. **Image not loading**: Check that the image path is correct and accessible
3. **Performance issues**: Reduce `patternScale` or `speed` values
4. **Blurry output**: Ensure the container has proper dimensions

### Image Requirements

- **Formats**: SVG, PNG, JPG
- **Size**: Optimal 512x512px or larger for best quality
- **Transparency**: PNG with alpha channel recommended
- **Contrast**: High contrast logos work best

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details