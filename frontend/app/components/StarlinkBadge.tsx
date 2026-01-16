"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Satellite } from 'lucide-react';

interface NetworkInfo {
    ip: string;
    isp: string;
    is_starlink: boolean;
}

export function StarlinkBadge() {
    const [info, setInfo] = useState<NetworkInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/test/network-info/')
            .then(res => res.json())
            .then(data => {
                setInfo(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-gray-500 text-sm animate-pulse">Detecting network...</div>;

    if (!info) return <div className="text-red-500 text-sm">Network detection failed</div>;

    return (
        <motion.div 
            className="flex items-center space-x-3 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-800"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {info.is_starlink ? (
                <>
                    <div className="relative">
                        <Satellite className="w-5 h-5 text-green-400" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-none">SpaceX Starlink</span>
                        <span className="text-[10px] text-green-400 font-mono tracking-wider">VERIFIED CONNECTION</span>
                    </div>
                </>
            ) : (
                <>
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-300">{info.isp || "Unknown ISP"}</span>
                        <span className="text-[10px] text-gray-500">{info.ip}</span>
                    </div>
                </>
            )}
        </motion.div>
    );
}
