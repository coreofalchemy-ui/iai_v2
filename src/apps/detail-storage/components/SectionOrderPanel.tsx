/**
 * SectionOrderPanel Component
 * Drag-and-drop interface for reordering detail page sections
 */

import React, { useState } from 'react';

export type SectionType =
    | 'title'
    | 'intro'
    | 'technology'
    | 'height'
    | 'product-info'
    | 'size-check'
    | 'product-cuts'
    | 'model-foot'
    | 'model-cuts'
    | 'detail-cuts';

export interface Section {
    id: string;
    type: SectionType;
    title: string;
    enabled: boolean;
    icon: string;
}

interface SectionOrderPanelProps {
    sections: Section[];
    onReorder: (newOrder: Section[]) => void;
    onToggle: (sectionId: string) => void;
}

const SectionOrderPanel: React.FC<SectionOrderPanelProps> = ({ sections, onReorder, onToggle }) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newSections = [...sections];
        const [draggedSection] = newSections.splice(draggedIndex, 1);
        newSections.splice(dropIndex, 0, draggedSection);

        onReorder(newSections);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h3 className="font-semibold text-base">섹션 순서</h3>
                </div>
                <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <>
                    <div className="px-4 pb-2">
                        <span className="text-xs text-gray-500">드래그하여 순서 변경</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto px-4 pb-4">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-move transition-all ${draggedIndex === index
                                        ? 'opacity-50 border-blue-400'
                                        : dragOverIndex === index
                                            ? 'border-blue-400 bg-blue-50'
                                            : section.enabled
                                                ? 'border-green-200 bg-green-50 hover:border-green-300'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-gray-400 cursor-grab active:cursor-grabbing text-sm">⋮⋮</span>
                                <span className="text-base">{section.icon}</span>
                                <span className="flex-1 font-medium text-xs">{section.title}</span>
                                <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={section.enabled}
                                        onChange={() => onToggle(section.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SectionOrderPanel;
