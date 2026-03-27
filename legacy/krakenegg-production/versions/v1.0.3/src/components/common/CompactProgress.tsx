import { motion } from 'framer-motion';

interface CompactProgressProps {
  progress: number; // 0-100
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  size?: 'xs' | 'sm' | 'md';
  color?: 'blue' | 'green' | 'orange' | 'red';
}

const CompactProgress = ({
  progress,
  label,
  sublabel,
  showPercentage = true,
  size = 'sm',
  color = 'blue'
}: CompactProgressProps) => {
  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm'
  };

  const colorClasses = {
    blue: 'bg-mac26-blue-500',
    green: 'bg-mac26-green-500',
    orange: 'bg-mac26-orange-500',
    red: 'bg-mac26-red-500'
  };

  return (
    <div className="space-y-1">
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className={`flex justify-between items-center ${textSizes[size]} text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark`}>
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(progress)}%</span>}
        </div>
      )}

      {/* Progress bar */}
      <div className={`w-full bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Sublabel */}
      {sublabel && (
        <div className={`${textSizes[size]} text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark`}>
          {sublabel}
        </div>
      )}
    </div>
  );
};

export default CompactProgress;