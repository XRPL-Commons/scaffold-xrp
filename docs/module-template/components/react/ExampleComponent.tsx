import React from 'react';

interface ExampleComponentProps {
  title?: string;
  children?: React.ReactNode;
}

/**
 * Example React component for scaffold-xrp module
 */
export function ExampleComponent({ title = 'Example Module', children }: ExampleComponentProps) {
  return (
    <div className="p-4 border border-secondary rounded-lg">
      <h2 className="text-xl font-bold text-accent mb-2">{title}</h2>
      <div className="text-gray-300">
        {children || 'This is an example component from a scaffold-xrp module.'}
      </div>
    </div>
  );
}

export default ExampleComponent;
