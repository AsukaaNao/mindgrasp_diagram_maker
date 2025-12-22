import React, { useState, useRef, useEffect } from 'react';
import { DiagramNode } from '../types';

interface NodeComponentProps {
  node: DiagramNode;
  isSelected: boolean;
  isConnectionStart: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onClick: (e: React.MouseEvent, id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  isConnectionStart,
  onMouseDown,
  onClick,
  onUpdateLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(node.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempLabel(node.label);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateLabel(node.id, tempLabel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleInputMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseDown={(e) => !isEditing && onMouseDown(e, node.id)}
      onClick={(e) => onClick(e, node.id)}
      className="cursor-move group"
    >
      {/* Oversized Invisible Hit Area */}
      <rect 
          x="-25" 
          y="-25" 
          width="170" 
          height="110" 
          fill="transparent" 
          onDoubleClick={handleDoubleClick}
      />

      {/* Target Aura */}
      {isSelected && (
        <rect
          x="-6"
          y="-6"
          width="132"
          height="72"
          rx="12"
          className="fill-blue-500/5 dark:fill-blue-400/5 stroke-blue-500/20 stroke-1 animate-pulse"
        />
      )}

      {/* Node Body */}
      <rect
        width="120"
        height="60"
        rx="8"
        className={`transition-all duration-300
            ${isSelected ? 'stroke-blue-500 stroke-2 shadow-lg shadow-blue-500/20' : 'stroke-gray-300 dark:stroke-gray-700 stroke-1 group-hover:stroke-gray-400'}
            ${isConnectionStart ? 'stroke-green-500 stroke-[3px]' : ''}
            fill-white dark:fill-gray-800
        `}
      />

      {/* Selection Markers (Modern Corners) */}
      {isSelected && (
        <>
          <path d="M 0 10 L 0 0 L 10 0" fill="none" className="stroke-blue-500 stroke-2" />
          <path d="M 110 0 L 120 0 L 120 10" fill="none" className="stroke-blue-500 stroke-2" />
          <path d="M 0 50 L 0 60 L 10 60" fill="none" className="stroke-blue-500 stroke-2" />
          <path d="M 110 60 L 120 60 L 120 50" fill="none" className="stroke-blue-500 stroke-2" />
        </>
      )}

      {/* Node Label */}
      {isEditing ? (
        <foreignObject x="8" y="15" width="104" height="30">
          <input
            ref={inputRef}
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={handleInputMouseDown}
            className="w-full h-full text-center text-sm border-none outline-none rounded-md text-gray-800 dark:text-white bg-blue-50 dark:bg-blue-900/40 font-medium"
          />
        </foreignObject>
      ) : (
        <text
          x="60"
          y="35"
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-sm font-semibold pointer-events-none select-none transition-colors duration-300
            ${isSelected ? 'fill-blue-600 dark:fill-blue-400' : 'fill-gray-700 dark:fill-gray-200'}
          `}
          onDoubleClick={handleDoubleClick}
        >
          {node.label}
        </text>
      )}
    </g>
  );
};