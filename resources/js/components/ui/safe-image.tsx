import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  skeletonClassName?: string;
  imgClassName?: string;
  onClick?: () => void;
};

export default function SafeImage({
  src,
  alt,
  fallbackSrc = '/marketing/images/branding/noon.jpg',
  className,
  skeletonClassName,
  imgClassName,
  onClick,
}: Props) {
  const normalizedSrc = typeof src === 'string' && src.trim() !== '' ? src : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(normalizedSrc);
    setLoaded(false);
    setFailed(false);
  }, [normalizedSrc]);

  return (
    <div className={cn('relative overflow-hidden', className)} onClick={onClick}>
      {!loaded ? (
        <div
          aria-hidden="true"
          className={cn('absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-800/70', skeletonClassName)}
        />
      ) : null}

      <img
        src={failed ? fallbackSrc : currentSrc}
        alt={alt}
        className={cn('h-full w-full object-cover transition duration-500', imgClassName, !loaded && 'opacity-0')}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed && fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setFailed(true);
            setLoaded(false);
            return;
          }

          setFailed(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}
