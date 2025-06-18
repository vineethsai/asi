import React from 'react';
import ArchitectureNavigator from '@/components/architecture/ArchitectureNavigator';

const TestNavigator = () => {
  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Architecture Navigator Test</h1>
      <div style={{ height: '600px', border: '1px solid #ccc' }}>
        <ArchitectureNavigator />
      </div>
    </div>
  );
};

export default TestNavigator; 