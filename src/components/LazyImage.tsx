import React, { useState } from "react";
import { Skeleton } from "./Skeleton";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackElement?: React.ReactNode;
  containerClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  style,
  fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='none'%3E%3Crect width='100' height='100' fill='%2327272a'/%3E%3Cpath d='M50 40V60M40 50H60' stroke='%2352525b' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E",
  fallbackElement,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={containerClassName}
      style={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",

        // Actually, let's keep it simple. Standard styles for container:
        width: "100%",
        height: "100%",
        // If containerClassName provides width/height in a non-Tailwind way, this might override.
        // But since we know the issue is missing Tailwind, we enforce 100% here.
      }}
    >
      {!isLoaded && !hasError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            width: "100%",
            height: "100%",
          }}
        >
          <Skeleton width="100%" height="100%" borderRadius={0} />
        </div>
      )}

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
          className={className}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "opacity 0.5s ease",
            opacity: isLoaded ? 1 : 0,
            ...style,
          }}
          {...props}
        />
      )}
    </div>
  );
};
