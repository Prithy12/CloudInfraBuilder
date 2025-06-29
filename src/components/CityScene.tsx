import React, { useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Html, PerspectiveCamera } from '@react-three/drei';
import { ArrowLeft } from 'lucide-react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import Building from './Building';
import DataFlow from './DataFlow';
import BoltBadge from './BoltBadge';
import { cityData, Tenant, Component } from '../data/cityData';
import { createPortal } from 'react-dom';

interface CitySceneProps {
  isVisible: boolean;
}

const ENV_OPTIONS = [
  { key: 'prod', label: 'Production', color: 'bg-blue-500' },
  { key: 'dev', label: 'Development', color: 'bg-green-500' },
  { key: 'qa', label: 'QA/Staging', color: 'bg-yellow-500' },
  { key: 'dr', label: 'Disaster Recovery', color: 'bg-orange-500' },
  { key: 'central', label: 'Central/Control', color: 'bg-gray-500' },
];

type ResourceType = 'load-balancer' | 'web-server' | 'app-server' | 'primary-db' | 'replica-db' | 'cache' | 'message-queue' | 'analytics';

export default function CityScene({ isVisible }: CitySceneProps) {
  const [tenants, setTenants] = useState<Tenant[]>(cityData.tenants);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [envFilters, setEnvFilters] = useState<string[]>(ENV_OPTIONS.map(opt => opt.key));
  const [search, setSearch] = useState('');
  const [highlightFlows, setHighlightFlows] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTenant, setModalTenant] = useState<Tenant | null>(null);
  const [modalComponents, setModalComponents] = useState<Component[]>([]);
  const [newResourceType, setNewResourceType] = useState<ResourceType>('web-server');
  const [newResourceDesc, setNewResourceDesc] = useState('');
  const [newResourceGroup, setNewResourceGroup] = useState('');

  // Filtering logic
  const filteredTenants = tenants.filter(t =>
    envFilters.includes(t.env) &&
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTenantIds = new Set(filteredTenants.map(t => t.id));
  const filteredLinks = cityData.links.filter(l => filteredTenantIds.has(l.from) && filteredTenantIds.has(l.to));

  const handleBuildingClick = (tenant: Tenant) => {
    if (tenant.id === 'time-portal') {
      setModalTenant(tenant);
      setSelectedTenant(tenant);
    }
  };

  const handleReset = () => {
    setSelectedTenant(null);
  };

  const handleAddResourceClick = (tenant: Tenant, components: Component[]) => {
    setModalTenant(tenant);
    setModalComponents(components);
    setNewResourceType('web-server');
    setNewResourceDesc('');
    setNewResourceGroup('');
    setShowAddModal(true);
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTenant || !newResourceDesc || !newResourceGroup) return;
    const newComponent: Component = {
      type: newResourceType,
      description: newResourceDesc,
      displayType: newResourceType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      resourceGroup: newResourceGroup,
      resourceName: `${modalTenant.name.toLowerCase().replace(/\s+/g, '-')}-${newResourceType}-${Date.now()}`,
      code: `// ${newResourceType} Resource\nresource "aws_instance" "${newResourceType.replace(/-/g, '_')}" {\n  ami           = "ami-0c55b159cbfafe1d0"\n  instance_type = "t3.medium"\n  \n  tags = {\n    Name        = "${newResourceType}"\n    Environment = "${modalTenant.env}"\n    ResourceGroup = "${newResourceGroup}"\n  }\n}`
    };
    setTenants(prevTenants => prevTenants.map(t => {
      if (t.id === modalTenant.id) {
        return {
          ...t,
          components: [...(t.components || []), newComponent],
          resources: [...(t.resources || []), newResourceType]
        };
      }
      return t;
    }));
    setShowAddModal(false);
    setModalTenant(null);
    setModalComponents([]);
  };

  // Filter panel UI
  const FilterPanel = (
    <div className="absolute top-4 left-4 z-30 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg w-72 shadow-xl">
      <h3 className="text-lg font-bold mb-2">Filters</h3>
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Search Tenant</label>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring"
          placeholder="Type tenant name..."
        />
      </div>
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Environments</label>
        <div className="flex flex-wrap gap-2">
          {ENV_OPTIONS.map(opt => (
            <label key={opt.key} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={envFilters.includes(opt.key)}
                onChange={() => setEnvFilters(f =>
                  f.includes(opt.key)
                    ? f.filter(env => env !== opt.key)
                    : [...f, opt.key]
                )}
                className="accent-blue-500"
              />
              <span className={`w-3 h-3 rounded ${opt.color}`}></span>
              <span className="text-xs">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={highlightFlows}
          onChange={() => setHighlightFlows(v => !v)}
          className="accent-blue-500"
        />
        <span className="text-xs">Highlight Data Flows</span>
      </div>
    </div>
  );

  const AddResourceModal = createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${showAddModal ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
      <div className="relative bg-gray-900 text-white p-6 rounded-lg shadow-2xl w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add New Resource</h2>
        <form onSubmit={handleAddResource} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resource Type</label>
            <select
              value={newResourceType}
              onChange={(e) => setNewResourceType(e.target.value as ResourceType)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="load-balancer">Load Balancer</option>
              <option value="web-server">Web Server</option>
              <option value="app-server">Application Server</option>
              <option value="primary-db">Primary Database</option>
              <option value="replica-db">Read Replica Database</option>
              <option value="cache">Cache Layer</option>
              <option value="message-queue">Message Queue</option>
              <option value="analytics">Analytics Engine</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={newResourceDesc}
              onChange={(e) => setNewResourceDesc(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe this resource..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resource Group</label>
            <input
              type="text"
              value={newResourceGroup}
              onChange={(e) => setNewResourceGroup(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., rg-prod-eastus-web01"
              required
            />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold">Add</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-10">
      <BoltBadge />
      {FilterPanel}
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
        {filteredTenants.map((tenant) => (
          <Building
            key={tenant.id}
            tenant={tenant}
            onClick={handleBuildingClick}
            isExploded={selectedTenant?.id === tenant.id}
            onAddResourceClick={handleAddResourceClick}
          />
        ))}
        {/* Data flow */}
        {!selectedTenant && (
          <DataFlow
            tenants={filteredTenants}
            links={filteredLinks}
            highlight={highlightFlows}
          />
        )}
        <CameraController 
          selectedTenant={selectedTenant}
          onReset={handleReset}
        />
      </Canvas>
      {/* Legend Overlay (bottom-right) */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Infrastructure City</h2>
          <p className="text-sm text-gray-300 mb-3">
            Explore your infrastructure as a 3D city ({filteredTenants.length} buildings)
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Production ({filteredTenants.filter(t => t.env === 'prod').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Development ({filteredTenants.filter(t => t.env === 'dev').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>QA/Staging ({filteredTenants.filter(t => t.env === 'qa').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Disaster Recovery ({filteredTenants.filter(t => t.env === 'dr').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Central/Control ({filteredTenants.filter(t => t.env === 'central').length})</span>
            </div>
          </div>
          {!selectedTenant && (
            <p className="text-xs text-gray-400 mt-3">
              Use the filter panel (top left) to search and filter buildings
            </p>
          )}
        </div>
      </div>
      {AddResourceModal}
    </div>
  );
}

function CameraController({ selectedTenant, onReset }: { selectedTenant: Tenant | null; onReset: () => void }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  React.useEffect(() => {
    if (selectedTenant && controlsRef.current) {
      // Animate camera to building
      const [x, z] = selectedTenant.position;
      camera.position.set(x + 3, 4, z + 3);
      controlsRef.current.target.set(x, 2, z);
      controlsRef.current.update();
    } else if (!selectedTenant && controlsRef.current) {
      // Return to overview but don't force position - allow free navigation
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
        minDistance={5}
        maxDistance={300}
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