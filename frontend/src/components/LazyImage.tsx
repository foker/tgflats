import React, { useState, useEffect, useRef } from 'react';
import { Box, Image, Skeleton } from '@chakra-ui/react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  borderRadius?: string | number;
  fallbackSrc?: string;
  blurhash?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = '100%',
  height = '100%',
  objectFit = 'cover',
  borderRadius = 0,
  fallbackSrc = '/placeholder.jpg',
  blurhash,
  priority = false,
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // High priority images load immediately
    if (priority) {
      loadImage();
      return;
    }

    // Setup Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current);
              }
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before the image is visible
          threshold: 0.01,
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Fallback for browsers that don't support Intersection Observer
      loadImage();
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src, priority]);

  const loadImage = () => {
    // Check if image is already in cache
    const img = new window.Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setIsError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setIsError(true);
      onError?.();
    };

    // Generate optimized image URL based on device pixel ratio
    const optimizedSrc = getOptimizedImageUrl(src);
    img.src = optimizedSrc;
  };

  const getOptimizedImageUrl = (originalSrc: string) => {
    // If it's an external URL, return as is
    if (originalSrc.startsWith('http')) {
      // Add image optimization service parameters if needed
      // Example: Cloudinary, Imgix, etc.
      return originalSrc;
    }

    // For local images, add responsive image parameters
    const dpr = window.devicePixelRatio || 1;
    const quality = dpr > 1 ? 85 : 90;
    
    // You can integrate with an image optimization service here
    // For now, return the original source
    return originalSrc;
  };

  const getWebPUrl = (url: string) => {
    // Convert image to WebP format if supported
    if ('WebP' in window) {
      return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return url;
  };

  return (
    <Box
      ref={imgRef}
      width={width}
      height={height}
      borderRadius={borderRadius}
      overflow="hidden"
      position="relative"
    >
      {isLoading && (
        <Skeleton
          width="100%"
          height="100%"
          position="absolute"
          top={0}
          left={0}
          startColor="gray.100"
          endColor="gray.300"
        />
      )}
      
      {imageSrc && (
        <picture>
          {/* WebP version for browsers that support it */}
          <source
            srcSet={getWebPUrl(imageSrc)}
            type="image/webp"
          />
          
          {/* Original format fallback */}
          <Image
            src={imageSrc}
            alt={alt}
            width="100%"
            height="100%"
            objectFit={objectFit}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            opacity={isLoading ? 0 : 1}
            transition="opacity 0.3s ease-in-out"
            onLoad={() => setIsLoading(false)}
          />
        </picture>
      )}
      
      {/* Blurhash placeholder (if provided) */}
      {blurhash && isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          background={`url(${blurhash})`}
          backgroundSize="cover"
          filter="blur(20px)"
          transform="scale(1.1)"
        />
      )}
    </Box>
  );
};

export default React.memo(LazyImage);