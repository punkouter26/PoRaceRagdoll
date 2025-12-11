import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createRagdoll, RACER_SPECIES } from '../physics/ragdolls';

export default function SelectionCanvas({ racers }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || racers.length === 0) return;

        const engine = new BABYLON.Engine(canvasRef.current, true);
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent

        // Lighting (Global)
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1.2;
        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
        dirLight.position = new BABYLON.Vector3(20, 40, 20);
        dirLight.intensity = 1.5;

        // Grid Configuration
        const cols = 4;
        const rows = 2;

        // We need to space the racers out in the world so they don't overlap in the cameras
        // But since we use different cameras/viewports, we can actually put them FAR apart.
        const worldSpacing = 100;

        racers.forEach((racer, index) => {
            // 1. Position Racer in World (Far apart)
            const xPos = index * worldSpacing;
            const rootPos = new BABYLON.Vector3(xPos, 0, 0);

            const species = RACER_SPECIES.find(s => s.name === racer.species) || RACER_SPECIES[0];
            const speciesWithColor = { ...species, color: racer.color };

            // Create Ragdoll
            const { root, parts } = createRagdoll(scene, rootPos, speciesWithColor, { noPhysics: true });
            parts.forEach(part => {
                if (part !== root) part.setParent(root);
            });

            // Animation
            scene.registerBeforeRender(() => {
                root.rotation.y += 0.01;
            });

            // 2. Create Camera for this Racer
            const getSpeciesSettings = (name) => {
                switch (name) {
                    case 'Spider': return { radius: 6, y: 0.5 };
                    case 'Snake': return { radius: 7, y: 0.0 };
                    case 'Crab': return { radius: 5, y: 0.5 };
                    case 'Penguin': return { radius: 3.5, y: 0.6 };
                    case 'Alien': return { radius: 4.5, y: 1.0 };
                    case 'Dog': return { radius: 5, y: 0.8 };
                    default: return { radius: 5.0, y: 0.8 };
                }
            };

            const camSettings = getSpeciesSettings(species.name);
            const camera = new BABYLON.ArcRotateCamera(`cam_${index}`, Math.PI / 2, Math.PI / 2.2, camSettings.radius, rootPos.clone().add(new BABYLON.Vector3(0, camSettings.y, 0)), scene);

            // 3. Define Viewport
            const colIndex = index % cols;
            const rowIndex = Math.floor(index / cols);

            // Invert Row for Bottom-Left origin (Row 0 is Top)
            const viewportY = rowIndex === 0 ? 0.5 : 0;
            const viewportX = colIndex * 0.25;

            camera.viewport = new BABYLON.Viewport(viewportX, viewportY, 0.25, 0.5);

            scene.activeCameras.push(camera);
        });

        engine.runRenderLoop(() => {
            scene.render();
        });

        const handleResize = () => engine.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            engine.dispose();
        };
    }, [racers]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />;
}
