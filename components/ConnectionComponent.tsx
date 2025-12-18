
import React from 'react';
import { DiagramNode } from '../types';

interface ConnectionComponentProps {
  id: string;
  fromNode: DiagramNode | undefined;
  toNode: DiagramNode | undefined;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ 
  id, 
  fromNode, 
  toNode, 
  isSelected,
  onSelect 
}) => {
  if (!fromNode || !toNode) return null;

  const x1 = fromNode.x + 60; 
  const y1 = fromNode.y + 30; 
  const x2 = toNode.x + 60;
  const y2 = toNode.y + 30;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <g onClick={handleClick} className="cursor-pointer group">
      {/* Hit Area */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth="20"
      />
      
      {/* Visible line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`transition-colors duration-200 ${
            isSelected ? 'stroke-blue-500 stroke-[3px]' : 'stroke-gray-500 dark:stroke-gray-400 stroke-2'
        }`}
      />
    </g>
  );
};