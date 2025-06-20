import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Mesh } from 'three';
import { Tenant } from '../data/cityData';

interface BuildingProps {
  tenant: Tenant;
  onClick: (tenant: Tenant) => void;
  isExploded: boolean;
}

const envColors = {
  dev: '#22c55e',    // green
  qa: '#eab308',     // yellow
  prod: '#3b82f6',   // blue
  dr: '#f97316',     // orange
  central: '#6b7280' // gray
};

export default function Building({ tenant, onClick, isExploded }: BuildingProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const height = tenant.resources.length * 0.5 + 0.5;
  const baseColor = envColors[tenant.env];
  
  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const handleClick = () => {
    onClick(tenant);
  };

  if (isExploded && tenant.components) {
    return (
      <group position={[tenant.position[0], 0, tenant.position[1]]}>
        {tenant.components.map((component, index) => (
          <group key={component.type} position={[0, index * 1.2 + 0.5, 0]}>
            <mesh>
              <boxGeometry args={[0.8, 0.4, 0.8]} />
              <meshBasicMaterial color={baseColor} opacity={0.8} transparent />
            </mesh>
            <Html position={[1.2, 0, 0]} className="pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm text-white p-2 rounded text-xs whitespace-nowrap">
                <div className="font-semibold">{component.type}</div>
                <div className="text-gray-300 text-xs">{component.description}</div>
              </div>
            </Html>
          </group>
        ))}
        <Html position={[0, -0.5, 0]} className="pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm text-black p-2 rounded text-center font-semibold">
            {tenant.name}
          </div>
        </Html>
      </group>
    );
  }

  return (
    <group position={[tenant.position[0], 0, tenant.position[1]]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        position={[0, height / 2, 0]}
      >
        <boxGeometry args={[1, height, 1]} />
        <meshBasicMaterial 
          color={hovered ? '#ffffff' : baseColor} 
          opacity={hovered ? 0.9 : 0.8}
          transparent
        />
      </mesh>
      
      <Html position={[0, -0.2, 0]} className="pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm text-black px-2 py-1 rounded text-xs text-center font-medium whitespace-nowrap">
          {tenant.name}
        </div>
      </Html>
    </group>
  );
}