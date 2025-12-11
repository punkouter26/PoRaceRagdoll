// src/components/SelectionCanvas_Cannon.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createRagdoll, RACER_SPECIES } from '../physics/ragdolls_cannon';

export default function SelectionCanvas({ racers }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || racers.length === 0) return;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasRef.current, 
            antialias: true,
            alpha: true 
        });
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;

        // Create scene
        const scene = new THREE.Scene();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(20, 40, 20);
        scene.add(dirLight);

        // Grid configuration
        const cols = 4;
        const worldSpacing = 100;

        // Store cameras and ragdoll roots for animation
        const cameras = [];
        const ragdollRoots = [];

        racers.forEach((racer, index) => {
            // Position racer far apart in world space
            const xPos = index * worldSpacing;
            const rootPos = new THREE.Vector3(xPos, 0, 0);

            const species = RACER_SPECIES.find(s => s.name === racer.species) || RACER_SPECIES[0];
            const speciesWithColor = { ...species, color: racer.color || species.color };

            // Create ragdoll (no physics for preview)
            const ragdoll = createRagdoll(scene, null, rootPos, speciesWithColor, { noPhysics: true });

            // Parent all parts to root for rotation
            const rootGroup = new THREE.Group();
            rootGroup.position.copy(rootPos);
            scene.add(rootGroup);

            ragdoll.parts.forEach(part => {
                // Remove from scene and add to group
                scene.remove(part);
                part.position.sub(rootPos); // Make position relative
                rootGroup.add(part);
            });

            ragdollRoots.push(rootGroup);

            // Create camera for this racer - zoom out more to fit in cell
            // Settings: radius = distance from creature, y = camera height, targetY = where to look
            const getSpeciesSettings = (name) => {
                switch (name) {
                    case 'Spider': return { radius: 6, y: 1.5, targetY: 0.8 };
                    case 'Snake': return { radius: 5, y: 1.0, targetY: 0.3 };
                    case 'Crab': return { radius: 5, y: 1.5, targetY: 0.8 };
                    case 'Penguin': return { radius: 5, y: 1.5, targetY: 1.0 };
                    case 'Alien': return { radius: 6, y: 2.0, targetY: 1.2 };
                    case 'Dog': return { radius: 6, y: 1.5, targetY: 0.8 };
                    case 'Dino': return { radius: 8, y: 2.5, targetY: 1.5 };
                    case 'Human': return { radius: 6, y: 2.0, targetY: 1.2 };
                    default: return { radius: 6, y: 1.5, targetY: 1.0 };
                }
            };

            const camSettings = getSpeciesSettings(species.name);
            const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
            camera.position.set(
                rootPos.x + camSettings.radius,
                rootPos.y + camSettings.y,
                rootPos.z
            );
            camera.lookAt(rootPos.x, rootPos.y + camSettings.targetY, rootPos.z);

            // Store viewport info - Three.js viewport origin is bottom-left
            const colIndex = index % cols;
            const rowIndex = Math.floor(index / cols);
            camera.userData = {
                viewport: {
                    x: colIndex * 0.25,
                    y: rowIndex === 0 ? 0.5 : 0, // Row 0 = top = y 0.5, Row 1 = bottom = y 0
                    width: 0.25,
                    height: 0.5
                },
                target: new THREE.Vector3(rootPos.x, camSettings.targetY, rootPos.z)
            };

            cameras.push(camera);
        });

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            // Rotate all ragdolls
            ragdollRoots.forEach(root => {
                root.rotation.y += 0.01;
            });

            // Render each camera viewport
            const width = renderer.domElement.width;
            const height = renderer.domElement.height;

            renderer.setScissorTest(true);

            cameras.forEach(camera => {
                const vp = camera.userData.viewport;
                const left = Math.floor(vp.x * width);
                const bottom = Math.floor(vp.y * height);
                const vpWidth = Math.floor(vp.width * width);
                const vpHeight = Math.floor(vp.height * height);

                renderer.setViewport(left, bottom, vpWidth, vpHeight);
                renderer.setScissor(left, bottom, vpWidth, vpHeight);

                camera.aspect = vpWidth / vpHeight;
                camera.updateProjectionMatrix();

                renderer.render(scene, camera);
            });

            renderer.setScissorTest(false);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!canvasRef.current) return;
            const width = canvasRef.current.clientWidth;
            const height = canvasRef.current.clientHeight;
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            renderer.dispose();
        };
    }, [racers]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />;
}
