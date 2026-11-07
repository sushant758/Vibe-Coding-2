'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Fallback CSS background if WebGL is unavailable or fails
function WebGLFallback() {
  return (
    <div
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-amber-100 via-orange-50 to-emerald-100"
    />
  );
}

// Low-poly human figure generator helper
function StylizedHuman({ position, rotation = [0, 0, 0], shirtColor = '#e11d48', skinColor = '#e0a96d', pose = 'standing' }) {
  // pose: 'standing' | 'bowler' | 'batsman' | 'keeper' | 'umpire' | 'fielder'
  return (
    <group position={position} rotation={rotation}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshToonMaterial color={skinColor} />
      </mesh>
      {/* Cap / Hair */}
      <mesh position={[0, 1.72, 0.02]}>
        <sphereGeometry args={[0.19, 8, 6]} />
        <meshToonMaterial color="#292524" />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.38, 0.6, 0.22]} />
        <meshToonMaterial color={shirtColor} />
      </mesh>

      {/* Legs (trouser white or dark) */}
      <mesh position={[-0.1, 0.45, 0]}>
        <boxGeometry args={[0.14, 0.7, 0.16]} />
        <meshToonMaterial color="#f5f5f4" />
      </mesh>
      <mesh position={[0.1, 0.45, 0]}>
        <boxGeometry args={[0.14, 0.7, 0.16]} />
        <meshToonMaterial color="#f5f5f4" />
      </mesh>

      {/* Arms depending on pose */}
      {pose === 'bowler' && (
        <>
          {/* Bowling arm extended straight up & forward */}
          <mesh position={[0.26, 1.6, 0.1]} rotation={[-0.3, 0, -0.2]}>
            <boxGeometry args={[0.1, 0.75, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          {/* Non-bowling arm tucked */}
          <mesh position={[-0.26, 1.1, -0.2]} rotation={[0.8, 0, 0.3]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
        </>
      )}

      {pose === 'batsman' && (
        <>
          {/* Holding bat */}
          <mesh position={[-0.2, 1.0, 0.15]} rotation={[0.4, 0.2, -0.3]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0.2, 1.0, 0.15]} rotation={[0.4, -0.2, 0.3]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          {/* Cricket Bat */}
          <mesh position={[0.1, 0.45, 0.35]} rotation={[0.2, 0, 0.1]}>
            <boxGeometry args={[0.1, 0.7, 0.04]} />
            <meshToonMaterial color="#d97706" />
          </mesh>
          {/* Bat handle */}
          <mesh position={[0.1, 0.85, 0.33]} rotation={[0.2, 0, 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
            <meshToonMaterial color="#fafaf9" />
          </mesh>
          {/* Pads */}
          <mesh position={[-0.1, 0.45, 0.08]}>
            <boxGeometry args={[0.16, 0.65, 0.06]} />
            <meshToonMaterial color="#fafaf9" />
          </mesh>
          <mesh position={[0.1, 0.45, 0.08]}>
            <boxGeometry args={[0.16, 0.65, 0.06]} />
            <meshToonMaterial color="#fafaf9" />
          </mesh>
        </>
      )}

      {pose === 'keeper' && (
        <>
          {/* Crouched */}
          <mesh position={[-0.25, 0.9, 0.15]} rotation={[0.9, 0.2, -0.2]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0.25, 0.9, 0.15]} rotation={[0.9, -0.2, 0.2]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          {/* Big keeping gloves */}
          <mesh position={[-0.2, 0.75, 0.4]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshToonMaterial color="#2563eb" />
          </mesh>
          <mesh position={[0.2, 0.75, 0.4]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshToonMaterial color="#2563eb" />
          </mesh>
        </>
      )}

      {pose === 'umpire' && (
        <>
          {/* Both arms raised signalling */}
          <mesh position={[-0.26, 1.7, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
            <meshToonMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.26, 1.7, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
            <meshToonMaterial color="#1e293b" />
          </mesh>
          {/* White umpire hat */}
          <mesh position={[0, 1.76, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 12]} />
            <meshToonMaterial color="#f8fafc" />
          </mesh>
        </>
      )}

      {pose === 'fielder' && (
        <>
          {/* Mid stride */}
          <mesh position={[-0.25, 1.1, 0.1]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0.25, 1.1, -0.1]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.1]} />
            <meshToonMaterial color={shirtColor} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Stumps with bails at one end
function Wickets({ position }) {
  return (
    <group position={position}>
      {/* 3 Stumps */}
      <mesh position={[-0.1, 0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.71, 6]} />
        <meshToonMaterial color="#fef08a" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.71, 6]} />
        <meshToonMaterial color="#fef08a" />
      </mesh>
      <mesh position={[0.1, 0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.71, 6]} />
        <meshToonMaterial color="#fef08a" />
      </mesh>
      {/* Bails */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.24, 0.02, 0.02]} />
        <meshToonMaterial color="#ca8a04" />
      </mesh>
    </group>
  );
}

// Crowd using InstancedMesh for high performance
function StadiumCrowd({ count = 600 }) {
  const meshRef = useRef();

  const colors = useMemo(() => {
    const palette = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#eab308'];
    return palette.map((c) => new THREE.Color(c));
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const radiusInner = 38;
    const tiers = 5;

    let index = 0;
    for (let t = 0; t < tiers; t++) {
      const tierRadius = radiusInner + t * 2.2;
      const tierHeight = 2.0 + t * 1.8;
      const peopleInTier = Math.floor(count / tiers);

      for (let i = 0; i < peopleInTier; i++) {
        const angle = (i / peopleInTier) * Math.PI * 2;
        const x = Math.cos(angle) * (tierRadius + (Math.random() - 0.5) * 0.8);
        const z = Math.sin(angle) * (tierRadius * 0.85 + (Math.random() - 0.5) * 0.8);
        const y = tierHeight + (Math.random() - 0.5) * 0.3;

        dummy.position.set(x, y, z);
        dummy.rotation.y = -angle - Math.PI / 2;
        dummy.scale.set(0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.4, 0.7 + Math.random() * 0.3);
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(index, dummy.matrix);
        meshRef.current.setColorAt(index, colors[Math.floor(Math.random() * colors.length)]);
        index++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [count, colors]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[0.5, 0.9, 0.35]} />
      <meshToonMaterial />
    </instancedMesh>
  );
}

// Frozen Confetti floating in mid-air
function FrozenConfetti({ count = 180 }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const colors = [
      new THREE.Color('#f43f5e'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#facc15'),
      new THREE.Color('#4ade80'),
      new THREE.Color('#c084fc'),
    ];

    for (let i = 0; i < count; i++) {
      const radius = 5 + Math.random() * 25;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 1.5 + Math.random() * 9;

      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(0.12, 0.08, 0.01);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, colors[Math.floor(Math.random() * colors.length)]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// Camera Waypoint Controller for continuous smooth 60-80s loop
function CameraLoop() {
  const curve = useMemo(() => {
    // Waypoints for cinematic sweeping orbit around the ground and pitch
    const points = [
      new THREE.Vector3(0, 4, 18),      // Low front angle towards batsman
      new THREE.Vector3(-12, 6, 10),    // Sweeping side arc
      new THREE.Vector3(-16, 8, -6),    // Behind bowler
      new THREE.Vector3(-8, 3.5, -12),  // Extreme close-up of frozen ball & bowler release
      new THREE.Vector3(12, 9, -14),    // Mid-tier stand view
      new THREE.Vector3(20, 14, 0),     // High aerial view of oval ground
      new THREE.Vector3(14, 5, 14),     // Near umpire signalling six
      new THREE.Vector3(4, 3, 16),      // Behind keeper looking down pitch
    ];
    return new THREE.CatmullRomCurve3(points, true, 'centripetal');
  }, []);

  const lookTargets = useMemo(() => {
    // Focus gently around pitch center and the frozen ball
    return [
      new THREE.Vector3(0, 1.2, 5),   // Batsman area
      new THREE.Vector3(0, 1.5, 0),   // Pitch center
      new THREE.Vector3(-2, 2.2, -6), // Bowler and frozen ball
      new THREE.Vector3(0, 1.2, 6),   // Wicketkeeper & batsman
    ];
  }, []);

  useFrame(({ clock, camera }) => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      camera.position.set(-6, 4.5, 14);
      camera.lookAt(0, 1.5, 0);
      return;
    }

    const t = (clock.getElapsedTime() % 75) / 75; // 75 seconds per full loop
    const point = curve.getPointAt(t);
    camera.position.copy(point);

    // Gently drift lookAt target
    const targetIdx = Math.floor(t * lookTargets.length) % lookTargets.length;
    const nextTargetIdx = (targetIdx + 1) % lookTargets.length;
    const subT = (t * lookTargets.length) % 1;
    const currentLook = lookTargets[targetIdx].clone().lerp(lookTargets[nextTargetIdx], subT);

    camera.lookAt(currentLook);
  });

  return null;
}

// Stadium and Field Geometry
function StadiumScene() {
  return (
    <group>
      {/* 1. Cricket Field Ground with striped rings / mowing pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[36, 48]} />
        <meshToonMaterial color="#2d7a3e" />
      </mesh>
      {/* Outer lush grass ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <ringGeometry args={[22, 36, 48]} />
        <meshToonMaterial color="#226733" />
      </mesh>
      {/* Inner circle strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[14, 22, 48]} />
        <meshToonMaterial color="#368e4c" />
      </mesh>

      {/* 2. Boundary Rope */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[34.8, 35.2, 64]} />
        <meshToonMaterial color="#fef9c3" />
      </mesh>

      {/* 3. The 22-yard Pitch Strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3.4, 20.12]} />
        <meshToonMaterial color="#b89367" />
      </mesh>

      {/* Crease Markings (white lines) */}
      {/* Bowling crease North */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -8.8]}>
        <planeGeometry args={[2.8, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Popping crease North */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -7.6]}>
        <planeGeometry args={[3.2, 0.12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Bowling crease South */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 8.8]}>
        <planeGeometry args={[2.8, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Popping crease South */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 7.6]}>
        <planeGeometry args={[3.2, 0.12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Wickets at both ends */}
      <Wickets position={[0, 0, -8.8]} />
      <Wickets position={[0, 0, 8.8]} />

      {/* 4. THE PLAYERS (Frozen Moment) */}
      {/* Batsman in stance at South end */}
      <StylizedHuman
        position={[0.2, 0, 7.4]}
        rotation={[0, -Math.PI / 2, 0]}
        shirtColor="#0284c7"
        skinColor="#d97706"
        pose="batsman"
      />

      {/* Non-striker batsman at North end */}
      <StylizedHuman
        position={[-1.2, 0, -7.5]}
        rotation={[0, Math.PI / 2, 0]}
        shirtColor="#0284c7"
        skinColor="#b45309"
        pose="standing"
      />

      {/* Wicketkeeper crouched behind south stumps */}
      <StylizedHuman
        position={[0, 0, 10.4]}
        rotation={[0, 0, 0]}
        shirtColor="#dc2626"
        skinColor="#f59e0b"
        pose="keeper"
      />

      {/* Bowler frozen mid-air at release stride at North end */}
      <StylizedHuman
        position={[-0.4, 0.15, -7.2]}
        rotation={[0, 0, 0]}
        shirtColor="#dc2626"
        skinColor="#b45309"
        pose="bowler"
      />

      {/* THE FROZEN CRICKET BALL hanging in air right after release! */}
      <mesh position={[-0.2, 2.3, -6.1]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshToonMaterial color="#b91c1c" />
      </mesh>
      {/* Dotted motion trail behind the frozen ball */}
      {[-6.4, -6.65, -6.9, -7.1].map((z, idx) => (
        <mesh key={idx} position={[-0.2, 2.38 - idx * 0.05, z]}>
          <sphereGeometry args={[0.035 - idx * 0.006, 6, 6]} />
          <meshBasicMaterial color="#fca5a5" transparent opacity={0.6 - idx * 0.12} />
        </mesh>
      ))}

      {/* Umpire standing frozen with both arms raised signalling six */}
      <StylizedHuman
        position={[0, 0, -10.5]}
        rotation={[0, 0, 0]}
        shirtColor="#1e293b"
        skinColor="#f59e0b"
        pose="umpire"
      />

      {/* Fielders frozen mid-stride around the ground */}
      <StylizedHuman position={[9, 0, 6]} rotation={[0, -2, 0]} shirtColor="#dc2626" pose="fielder" />
      <StylizedHuman position={[-11, 0, 12]} rotation={[0, 2.2, 0]} shirtColor="#dc2626" pose="fielder" />
      <StylizedHuman position={[15, 0, -10]} rotation={[0, -2.8, 0]} shirtColor="#dc2626" pose="fielder" />
      <StylizedHuman position={[-16, 0, -5]} rotation={[0, 1.2, 0]} shirtColor="#dc2626" pose="fielder" />
      <StylizedHuman position={[4, 0, 18]} rotation={[0, 3.1, 0]} shirtColor="#dc2626" pose="fielder" />

      {/* 5. Stadium Stands Tiers surrounding the oval */}
      {[0, 1, 2, 3, 4].map((tier) => (
        <mesh key={tier} position={[0, tier * 1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[37 + tier * 2.2, 39 + tier * 2.2, 48]} />
          <meshToonMaterial color={tier % 2 === 0 ? '#475569' : '#334155'} />
        </mesh>
      ))}

      {/* Stadium outer wall */}
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[49, 49, 10, 48, 1, true]} />
        <meshToonMaterial color="#64748b" side={THREE.DoubleSide} />
      </mesh>

      {/* 6. High-performance Instanced Crowd in stands */}
      <StadiumCrowd count={550} />

      {/* 7. Frozen Confetti */}
      <FrozenConfetti count={160} />

      {/* 8. Floodlight Towers at 4 corners */}
      {[
        [-32, -32],
        [32, -32],
        [-32, 32],
        [32, 32],
      ].map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          {/* Lattice Mast */}
          <mesh position={[0, 10, 0]}>
            <cylinderGeometry args={[0.3, 0.7, 20, 4]} />
            <meshToonMaterial color="#334155" />
          </mesh>
          {/* Light Grid Head */}
          <mesh position={[0, 20.2, 0]} rotation={[0.4, Math.atan2(-z, -x), 0]}>
            <boxGeometry args={[4.5, 2.8, 0.4]} />
            <meshToonMaterial color="#e2e8f0" />
          </mesh>
        </group>
      ))}

      {/* 9. Generic Stylized Scoreboard */}
      <group position={[0, 9, -42]} rotation={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[14, 6, 0.6]} />
          <meshToonMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.32]}>
          <planeGeometry args={[13.2, 5.2]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        {/* Yellow electronic score digits simulation */}
        {[-4, -1.5, 1.5, 4].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, 0.5, 0.35]}>
            <planeGeometry args={[1.6, 2.2]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
        ))}
      </group>

      {/* Warm evening sky hemisphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[120, 24, 16]} />
        <meshBasicMaterial color="#fed7aa" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

export default function CricketScene() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return <WebGLFallback />;
  }

  return (
    <div
      tabIndex={-1}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      style={{
        filter: 'contrast(1.08) saturate(1.15)',
      }}
    >
      <Canvas
        camera={{ position: [-8, 6, 18], fov: 45 }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        <color attach="background" args={['#fed7aa']} />

        {/* Ambient pencil light and warm sun */}
        <ambientLight intensity={1.1} />
        <directionalLight position={[20, 40, 15]} intensity={1.8} color="#fffbeb" />
        <directionalLight position={[-20, 15, -15]} intensity={0.6} color="#fdba74" />

        <CameraLoop />
        <StadiumScene />
      </Canvas>

      {/* Hand-drawn coloured-pencil overlay & paper grain effect */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8), rgba(120,80,40,0.3)), repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 4px)`,
        }}
      />
      {/* Subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 45%, rgba(68,36,18,0.25) 100%)',
        }}
      />
    </div>
  );
}
