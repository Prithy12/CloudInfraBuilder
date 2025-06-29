import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { Tenant, Link } from '../data/cityData';

interface DataFlowProps {
  tenants: Tenant[];
  links: Link[];
  highlight?: boolean;
}

export default function DataFlow({ tenants, links, highlight }: DataFlowProps) {
  const sphereRefs = useRef<(Mesh | null)[]>([]);
  
  const flows = useMemo(() => {
    return links.map((link, index) => {
      const fromTenant = tenants.find(t => t.id === link.from);
      const toTenant = tenants.find(t => t.id === link.to);
      
      if (!fromTenant || !toTenant) return null;
      
      const start = new Vector3(fromTenant.position[0], 0.5, fromTenant.position[1]);
      const end = new Vector3(toTenant.position[0], 0.5, toTenant.position[1]);
      const distance = start.distanceTo(end);
      
      return {
        id: `${link.from}-${link.to}-${index}`,
        start,
        end,
        distance,
        type: link.type,
        progress: Math.random() // Start at random positions
      };
    }).filter(Boolean);
  }, [tenants, links]);

  useFrame((state) => {
    flows.forEach((flow, index) => {
      if (!flow || !sphereRefs.current[index]) return;
      
      const sphere = sphereRefs.current[index];
      const speed = 0.01;
      
      // Update progress
      flow.progress += speed;
      if (flow.progress > 1) {
        flow.progress = 0;
      }
      
      // Calculate position along the path
      const position = new Vector3().lerpVectors(flow.start, flow.end, flow.progress);
      sphere.position.copy(position);
      
      // Add some vertical bobbing
      sphere.position.y += Math.sin(state.clock.elapsedTime * 3 + index) * 0.1;
      
      // Add subtle rotation
      sphere.rotation.y += 0.02;
    });
  });

  const getFlowColor = (type: string) => {
    if (highlight) return '#f43f5e'; // rose-500 for highlight
    switch (type) {
      case 'data': return '#3b82f6'; // blue
      case 'sync': return '#10b981'; // emerald
      case 'backup': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
  };

  const getFlowMaterial = (type: string) => {
    const color = getFlowColor(type);
    return {
      color,
      emissive: color,
      emissiveIntensity: highlight ? 0.3 : 0.1,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9
    };
  };

  return (
    <>
      {flows.map((flow, index) => (
        flow && (
          <React.Fragment key={flow.id}>
            {/* Data flow sphere */}
            <mesh
              ref={(el) => { sphereRefs.current[index] = el; }}
              position={[flow.start.x, flow.start.y, flow.start.z]}
              castShadow
            >
              <sphereGeometry args={[highlight ? 0.12 : 0.08, 16, 16]} />
              <meshStandardMaterial {...getFlowMaterial(flow.type)} />
            </mesh>
            
            {/* Glow effect for highlighted flows */}
            {highlight && (
              <mesh
                position={[flow.start.x, flow.start.y, flow.start.z]}
              >
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshStandardMaterial 
                  color="#f43f5e"
                  emissive="#f43f5e"
                  emissiveIntensity={0.2}
                  transparent
                  opacity={0.3}
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
            )}
            
            {/* Connection line */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    flow.start.x, 0.1, flow.start.z,
                    flow.end.x, 0.1, flow.end.z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color={highlight ? '#f43f5e' : '#64748b'} 
                opacity={highlight ? 0.8 : 0.4} 
                transparent 
                linewidth={highlight ? 3 : 1}
              />
            </line>
          </React.Fragment>
        )
      ))}
    </>
  );
}