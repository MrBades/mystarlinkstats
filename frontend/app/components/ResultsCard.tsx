"use client";

import { Activity, ArrowDown, ArrowUp } from "lucide-react";

interface ResultsCardProps {
    label: string;
    value: string;
    unit: string;
    icon?: 'ping' | 'download' | 'upload';
    subValue?: string;
}

export function ResultsCard({ label, value, unit, icon, subValue }: ResultsCardProps) {
    return (
        <div className="bg-[#151921] p-4 rounded-xl border border-gray-800 flex flex-col justify-between w-full h-full hover:border-[#005288] transition-colors group">
            <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">{label}</span>
                {icon === 'ping' && <Activity className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />}
                {icon === 'download' && <ArrowDown className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />}
                {icon === 'upload' && <ArrowUp className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />}
            </div>
            <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-white">{value}</span>
                <span className="text-xs text-gray-500 font-medium">{unit}</span>
            </div>
            {subValue && (
                <div className="mt-1 text-xs text-gray-600">
                    {subValue}
                </div>
            )}
        </div>
    );
}
