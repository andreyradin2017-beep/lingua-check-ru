import React, { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1.5,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });

    return () => controls.stop();
  }, [value, duration]);

  return <>{displayValue}</>;
};
