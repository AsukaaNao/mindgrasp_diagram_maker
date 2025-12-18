
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
      className="cursor-move"
    >
      {/* Node Body */}
      <rect
        width="120"
        height="60"
        rx="6"
        className={`transition-all duration-200 
            ${isSelected ? 'stroke-blue-500 stroke-2' : 'stroke-gray-400 dark:stroke-gray-600 stroke-1'}
            ${isConnectionStart ? 'stroke-green-500 stroke-[3px]' : ''}
            fill-white dark:fill-gray-800
        `}
        filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.1))"
      />

      {/* Node Label */}
      {isEditing ? (
        <foreignObject x="5" y="15" width="110" height="30">
          <input
            ref={inputRef}
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={handleInputMouseDown}
            className="w-full h-full text-center text-sm border-none outline-none rounded text-gray-800 dark:text-white bg-blue-50 dark:bg-blue-900/30"
          />
        </foreignObject>
      ) : (
        <text
          x="60"
          y="35"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-medium pointer-events-none select-none fill-gray-700 dark:fill-gray-200"
          onDoubleClick={handleDoubleClick}
        >
          {node.label}
        </text>
      )}
      
      {!isEditing && (
        <rect 
            x="0" 
            y="0" 
            width="120" 
            height="60" 
            fill="transparent" 
            onDoubleClick={handleDoubleClick}
        />
      )}
    </g>
  );
};
