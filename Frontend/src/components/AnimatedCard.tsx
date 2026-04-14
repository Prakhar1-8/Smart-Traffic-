import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCard({ children, index = 0, className = "", style }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`bg-card border border-border rounded-lg p-6 ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}
