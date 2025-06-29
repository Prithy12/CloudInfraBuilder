import React from 'react';
import { Html } from '@react-three/drei';
import { ArrowLeft, Code, Info } from 'lucide-react';
import { Component } from '../data/cityData';

interface FloorViewProps {
  component: Component;
  floorNumber: number;
  onBack: () => void;
  position: [number, number, number];
}

export default function FloorView({ component, floorNumber, onBack, position }: FloorViewProps) {
  // Format type for display
  const formatType = (type?: string) => {
    if (!type) return 'Unknown';
    return type
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Html position={position} className="pointer-events-auto" transform>
      <div className="bg-black/90 backdrop-blur-sm text-white p-6 rounded-lg shadow-2xl" style={{ width: '260px', height: '150px', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Floor {floorNumber}</h2>
              <p className="text-gray-300 text-sm">{component.type}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-gray-800 rounded-lg">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-200">{component.description}</p>
        </div>

        {/* Code Display */}
        {component.code && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400">Backend Code</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap">
                <code>{component.code}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Resource Info */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Resource Details</h3>
          <div className="flex flex-col gap-2 text-sm break-words">
            <div className="flex flex-wrap gap-x-1">
              <span className="text-gray-400">Type:</span>
              <span className="text-white break-words">{component.displayType || formatType(component.type)}</span>
            </div>
            <div className="flex flex-wrap gap-x-1">
              <span className="text-gray-400">Resource Group:</span>
              <span className="text-white break-words">{component.resourceGroup}</span>
            </div>
            <div className="flex flex-wrap gap-x-1">
              <span className="text-gray-400">Floor:</span>
              <span className="text-white break-words">{floorNumber}</span>
            </div>
            <div className="flex flex-wrap gap-x-1">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400">● Active</span>
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
} 