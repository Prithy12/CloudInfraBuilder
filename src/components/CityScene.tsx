import React, { useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Html, PerspectiveCamera } from '@react-three/drei';
import { ArrowLeft } from 'lucide-react';
import Building from './Building';
import DataFlow from './DataFlow';
import { cityData, Tenant } from '../data/cityData';

interface CitySceneProps {
  isVisible: boolean;
}

function CameraController({ 
  selectedTenant, 
  onReset 
}: { 
  selectedTenant: Tenant | null;
  onReset: () => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  React.useEffect(() => {
    if (selectedTenant && controlsRef.current) {
      // Animate camera to building
      const [x, z] = selectedTenant.position;
      camera.position.set(x + 3, 4, z + 3);
      controlsRef.current.target.set(x, 2, z);
      controlsRef.current.update();
    } else if (!selectedTenant && controlsRef.current) {
      // Return to overview - adjusted for larger city
      camera.position.set(0, 80, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [selectedTenant, camera]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={200}
      />
      {selectedTenant && (
        <Html position={[-6, 4, 0]} className="pointer-events-auto">
          <button
            onClick={onReset}
            className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-black/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to City
          </button>
        </Html>
      )}
    </>
  );
}

export default function CityScene({ isVisible }: CitySceneProps) {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Generate data from dynamic cityData
  const { tenants, links } = cityData;

  const handleBuildingClick = (tenant: Tenant) => {
    if (tenant.id === 'time-portal') {
      setSelectedTenant(tenant);
    }
  };

  const handleReset = () => {
    setSelectedTenant(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-10">
      <Canvas
        style={{ background: 'linear-gradient(to bottom, #0f172a, #1e293b)' }}
      >
        <PerspectiveCamera makeDefault position={[0, 80, 0]} fov={60} far={500} />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        
        <Sky sunPosition={[100, 20, 100]} />
        
        {/* Ground plane with grid - expanded for larger city */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        
        {/* Grid lines - expanded for larger city */}
        <gridHelper args={[200, 200, '#475569', '#334155']} position={[0, 0, 0]} />
        
        {/* Buildings */}
        {tenants.map((tenant) => (
          <Building
            key={tenant.id}
            tenant={tenant}
            onClick={handleBuildingClick}
            isExploded={selectedTenant?.id === tenant.id}
          />
        ))}
        
        {/* Data flow */}
        {!selectedTenant && <DataFlow />}
        
        <CameraController 
          selectedTenant={selectedTenant}
          onReset={handleReset}
        />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Infrastructure City</h2>
          <p className="text-sm text-gray-300 mb-3">
            Explore your infrastructure as a 3D city ({tenants.length} buildings)
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Production ({tenants.filter(t => t.env === 'prod').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Development ({tenants.filter(t => t.env === 'dev').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>QA/Staging ({tenants.filter(t => t.env === 'qa').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Disaster Recovery ({tenants.filter(t => t.env === 'dr').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Central/Control ({tenants.filter(t => t.env === 'central').length})</span>
            </div>
          </div>
          {!selectedTenant && (
            <p className="text-xs text-gray-400 mt-3">
              Click on the "Time Portal Services" building to explore its components
            </p>
          )}
        </div>
      </div>
    </div>
  );
}