"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface FallbackImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

const FallbackImage = ({
  src,
  alt = "Image", // Provide default value
  fallbackSrc = "/default-avatar.jpg", // Default to our local image
  className,
  ...props
}: FallbackImageProps) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Image src={fallbackSrc} alt={alt} className={className} {...props} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default FallbackImage;
