"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export function Button({ variant = "primary", size = "default", className, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30",
    secondary: "bg-white text-black hover:bg-gray-200",
    outline: "border border-white/20 hover:bg-white/10 text-white"
  };

  const sizes = {
    default: "px-6 py-3",
    sm: "px-3 py-1.5 text-sm",
    lg: "px-8 py-4 text-lg",
    icon: "h-10 w-10"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
