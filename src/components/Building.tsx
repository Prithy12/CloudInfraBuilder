import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Mesh } from 'three';
import { Tenant, Component } from '../data/cityData';
import FloorView from './FloorView';

const envColors = {
  dev: '#22c55e',    // green
  qa: '#eab308',     // yellow
  prod: '#3b82f6',   // blue
  dr: '#f97316',     // orange
  central: '#6b7280' // gray
};

interface BuildingProps {
  tenant: Tenant;
  onClick: (tenant: Tenant) => void;
  isExploded: boolean;
  onAddResourceClick: (tenant: Tenant, components: Component[]) => void;
}

export default function Building({ tenant, onClick, isExploded, onAddResourceClick }: BuildingProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Component | null>(null);

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

  const handleFloorClick = (component: Component) => {
    setSelectedFloor(component);
  };

  const handleBackFromFloor = () => {
    setSelectedFloor(null);
  };

  const components = tenant.components || [];

  if (isExploded && components) {
    return (
      <group position={[tenant.position[0], 0, tenant.position[1]]}>
        {selectedFloor ? (
          <FloorView
            component={selectedFloor}
            floorNumber={components.indexOf(selectedFloor) + 1}
            onBack={handleBackFromFloor}
            position={[0, 2, 0]}
          />
        ) : (
          <>
            {components.map((component, index) => (
              <group key={index} position={[0, index * 1.2 + 0.5, 0]}>
                <mesh
                  onClick={() => handleFloorClick(component)}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'default';
                  }}
                  ref={index === 0 ? meshRef : undefined}
                  position={[0, 0.2, 0]}
                >
                  <boxGeometry args={[0.8, 0.4, 0.8]} />
                  <meshBasicMaterial color={baseColor} opacity={0.8} transparent />
                </mesh>
                <Html position={[1.2, 0, 0]} className="pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-sm text-white p-2 rounded text-xs whitespace-nowrap">
                    <div className="font-semibold">Floor {index + 1}</div>
                    <div className="text-gray-300 text-xs">{component.displayType || component.type}</div>
                    <div className="text-blue-400 text-xs mt-1">Click to view details</div>
                  </div>
                </Html>
              </group>
            ))}
            {/* Add Resource Button */}
            <Html position={[0, components.length * 1.2 + 1, 0]} className="pointer-events-auto">
              <button
                onClick={() => onAddResourceClick(tenant, components)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg mt-2"
              >
                + Add Resource
              </button>
            </Html>
            <Html position={[0, -0.5, 0]} className="pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm text-black p-2 rounded text-center font-semibold">
                {tenant.name}
              </div>
            </Html>
          </>
        )}
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
        <meshBasicMaterial color={hovered ? '#ffffff' : baseColor} opacity={hovered ? 0.9 : 0.8} transparent />
      </mesh>
      {tenant.id === 'time-portal' && (
        <Html position={[0, -0.2, 0]} className="pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm text-black px-2 py-1 rounded text-xs text-center font-medium whitespace-nowrap">
            {tenant.name}
          </div>
        </Html>
      )}
    </group>
  );
}