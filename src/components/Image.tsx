import React, { useState } from "react";
import { Skeleton } from "./Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackElement?: React.ReactNode;
  containerClassName?: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='none'%3E%3Crect width='100' height='100' fill='%2327272a'/%3E%3Cpath d='M50 40V60M40 50H60' stroke='%2352525b' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E",
  fallbackElement,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={clsx("relative overflow-hidden", containerClassName)}
      style={{ isolation: "isolate" }}
    >
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10"
          >
            <Skeleton width="100%" height="100%" borderRadius={0} />
          </motion.div>
        )}
      </AnimatePresence>

      {hasError && fallbackElement ? (
        fallbackElement
      ) : (
        <img
          src={hasError ? fallbackSrc : src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={clsx(
            "w-full h-full object-cover transition-opacity duration-500",
            !isLoaded && "opacity-0",
            isLoaded && "opacity-100",
            className,
          )}
          {...props}
        />
      )}
    </div>
  );
};
