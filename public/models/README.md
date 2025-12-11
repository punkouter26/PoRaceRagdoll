# Adding Custom GLB Models as Racers

## Quick Start

1. **Drop your `.glb` file in this folder** (`public/models/`)
2. **Tell the AI assistant:**
   - The filename (e.g., `robot.glb`)
   - A display name (e.g., "Robot")
   - Approximate scale if needed

## Model Requirements

### Recommended Specs
- **Format:** GLB (binary glTF)
- **Polygon count:** Under 10,000 triangles for best performance
- **Size:** Model should be roughly 1-2 units tall at export
- **Origin:** Center of mass at origin (0, 0, 0)
- **Orientation:** Facing +Z or -Z direction

### Physics Types

When adding a model, specify how physics should work:

| Type | Description | Best For |
|------|-------------|----------|
| `simple` | Single physics body, whole model moves as one | Balls, blobs, simple shapes |
| `humanoid` | Head, torso, 2 arms, 2 legs with joints | Human-like characters |
| `quadruped` | Head, body, 4 legs with joints | Dogs, cats, horses |
| `custom` | You define the bodies and joints | Complex creatures |

## Example Models to Try

Free GLB models that work great:
- [Mixamo](https://www.mixamo.com/) - Animated humanoid characters
- [Sketchfab](https://sketchfab.com/) - Search for "low poly animal glb"
- [Kenney Assets](https://kenney.nl/) - Game-ready characters
- [Ready Player Me](https://readyplayer.me/) - Custom avatars

## File Naming

- Use lowercase with hyphens: `my-robot.glb`
- No spaces in filenames
- Keep names short and descriptive

## After Adding

Once you've added a GLB file, ask the AI:

```
"Add robot.glb as a new racer called 'Robot' with humanoid physics"
```

The AI will:
1. Add GLTFLoader import
2. Create a new species entry
3. Set up physics bodies
4. Add it to the racer selection

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model too big/small | Specify a scale value (e.g., `scale: 0.5`) |
| Model facing wrong way | Specify rotation offset |
| Model not loading | Check browser console for errors |
| Physics feels wrong | Adjust mass or physics type |

## Current Racers

The game includes 8 built-in primitive-based racers:
1. Human
2. Spider  
3. Dog
4. Snake
5. Crab
6. Dino
7. Penguin
8. Alien

Your GLB models will appear as additional options!
