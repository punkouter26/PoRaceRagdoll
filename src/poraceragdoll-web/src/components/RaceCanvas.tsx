'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPhysicsWorld, setupContactMaterials } from '@/physics/world';
import { createTrack, updateTrackAnimations, type AnimatedObject, type TrackResult } from '@/physics/track';
import { createRagdoll, syncRagdolls, RACER_SPECIES } from '@/physics/ragdolls';
import { useGameStore } from '@/store/gameStore';

interface RacerData {
    bodies: CANNON.Body[];
    parts: THREE.Mesh[];
    headBody: CANNON.Body;
}

export default function RaceCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const worldRef = useRef<CANNON.World | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const clockRef = useRef(new THREE.Clock());

    const racersRef = useRef<RacerData[]>([]);
    const trackRef = useRef<{ finishZ: number; animatedObjects: AnimatedObject[] } | null>(null);
    const frameIdRef = useRef<number>(0);
    const raceFinishedRef = useRef(false);

    const { racers, finishRace, state: gameState } = useGameStore();

    const initScene = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 50, 300);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 15, -30);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        scene.add(directionalLight);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(500, 500);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -5;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        // Physics World
        const world = createPhysicsWorld();
        setupContactMaterials(world);
        worldRef.current = world;

        // Track
        const slopeAngle = 20;
        const track = createTrack(scene, world, slopeAngle);
        trackRef.current = track;

        // Create racers
        const angleRad = THREE.MathUtils.degToRad(slopeAngle);
        const trackWidth = 20;
        const laneWidth = trackWidth / 8;

        racersRef.current = racers.map((racer, index) => {
            const laneX = -trackWidth / 2 + laneWidth / 2 + index * laneWidth;
            const startZ = -80;
            const localPos = new THREE.Vector3(laneX, 3, startZ);
            localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
            const worldPos = track.rampPos.clone().add(localPos);

            const species = RACER_SPECIES.find(s => s.type === racer.type) || RACER_SPECIES[0];
            const ragdoll = createRagdoll(
                scene,
                world,
                worldPos,
                { type: species.type, color: racer.color, mass: racer.mass }
            );

            return {
                bodies: ragdoll.bodies,
                parts: ragdoll.parts,
                headBody: ragdoll.headBody
            };
        });

        raceFinishedRef.current = false;
    }, [racers]);

    const animate = useCallback(() => {
        frameIdRef.current = requestAnimationFrame(animate);

        const world = worldRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const controls = controlsRef.current;
        const track = trackRef.current;

        if (!world || !scene || !camera || !renderer || !controls || !track) return;

        const deltaTime = Math.min(clockRef.current.getDelta(), 0.05);

        // Step physics
        world.step(1 / 60, deltaTime, 3);

        // Sync ragdolls
        syncRagdolls(racersRef.current);

        // Update animated obstacles
        if (track.animatedObjects) {
            updateTrackAnimations(track.animatedObjects, deltaTime);
        }

        // Follow leader camera
        let leadZ = -Infinity;
        let leaderPos = new THREE.Vector3();
        racersRef.current.forEach(racer => {
            const pos = racer.headBody.position;
            if (pos.z > leadZ) {
                leadZ = pos.z;
                leaderPos.set(pos.x, pos.y, pos.z);
            }
        });

        // Smooth camera follow
        const targetCamPos = new THREE.Vector3(
            leaderPos.x * 0.3,
            leaderPos.y + 12,
            leaderPos.z - 20
        );
        camera.position.lerp(targetCamPos, 0.05);
        camera.lookAt(leaderPos.x, leaderPos.y, leaderPos.z + 10);

        // Check for winner
        if (!raceFinishedRef.current && gameState === 'RACING') {
            racersRef.current.forEach((racer, index) => {
                if (racer.headBody.position.z >= track.finishZ) {
                    raceFinishedRef.current = true;
                    finishRace(index);
                }
            });
        }

        controls.update();
        renderer.render(scene, camera);
    }, [finishRace, gameState]);

    useEffect(() => {
        initScene();
        animate();

        const handleResize = () => {
            if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            window.removeEventListener('resize', handleResize);
            if (rendererRef.current && containerRef.current?.contains(rendererRef.current.domElement)) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current?.dispose();
        };
    }, [initScene, animate]);

    return <div ref={containerRef} className="w-full h-full" />;
}
