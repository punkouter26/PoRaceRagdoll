'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createRagdoll } from '@/physics/ragdolls';
import type { Racer } from '@/lib/api';

interface SelectionCanvasProps {
    racers: Racer[];
}

export default function SelectionCanvas({ racers }: SelectionCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const frameIdRef = useRef<number>(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(0, 3, 12);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Create ragdolls in 4x2 grid
        const ragdollObjects: THREE.Object3D[] = [];
        const cols = 4;
        const spacing = { x: 4, z: 3 };
        const offset = { x: -(cols - 1) * spacing.x / 2, z: spacing.z / 2 };

        racers.forEach((racer, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = offset.x + col * spacing.x;
            const z = offset.z - row * spacing.z;

            const ragdoll = createRagdoll(
                scene,
                null,
                { x, y: 0, z },
                { type: racer.type, color: racer.color, mass: racer.mass },
                { noPhysics: true }
            );
            ragdollObjects.push(ragdoll.root);
        });

        // Animation loop
        const clock = new THREE.Clock();
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Gentle floating animation
            ragdollObjects.forEach((obj, i) => {
                obj.position.y = Math.sin(time * 2 + i * 0.5) * 0.1;
                obj.rotation.y = Math.sin(time + i * 0.3) * 0.1;
            });

            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!container || !camera || !renderer) return;
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(frameIdRef.current);
            window.removeEventListener('resize', handleResize);
            if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
                container.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current?.dispose();
        };
    }, [racers]);

    return <div ref={containerRef} className="w-full h-full" />;
}
