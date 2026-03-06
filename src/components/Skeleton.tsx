import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    style?: React.CSSProperties;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1rem',
    borderRadius = 'var(--radius-sm)',
    style,
    className
}) => {
    return (
        <div
            className={className}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                position: 'relative',
                ...style
            }}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    transform: 'translateX(-100%)'
                }}
                animate={{
                    translateX: ['-100%', '100%']
                }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear'
                }}
            />
        </div>
    );
};
