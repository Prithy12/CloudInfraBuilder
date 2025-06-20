import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { cityData } from '../data/cityData';

export default function DataFlow() {
  const sphereRefs = useRef<(Mesh | null)[]>([]);
  
  const flows = useMemo(() => {
    return cityData.links.map((link, index) => {
      const fromTenant = cityData.tenants.find(t => t.id === link.from);
      const toTenant = cityData.tenants.find(t => t.id === link.to);
      
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
  }, []);

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
    });
  });

  const getFlowColor = (type: string) => {
    switch (type) {
      case 'data': return '#3b82f6'; // blue
      case 'sync': return '#10b981'; // emerald
      case 'backup': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
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
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color={getFlowColor(flow.type)} />
            </mesh>
            
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
              <lineBasicMaterial color="#64748b" opacity={0.3} transparent />
            </line>
          </React.Fragment>
        )
      ))}
    </>
  );
}