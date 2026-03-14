"use client";

import { motion } from "framer-motion";

export function ProgressBar({ value, max = 100, label }: { value: number, max?: number, label?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {label && <div className="text-xs text-gray-400 mb-1 flex justify-between"><span>{label}</span> <span>{Math.round(percentage)}%</span></div>}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "circOut" }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
    </div>
  );
}
