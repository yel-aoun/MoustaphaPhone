import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { FLICK_VELOCITY, SPRING_FLICK, SPRING_SETTLE, projectMomentum } from '@/lib/motion';

// Product photos on a track that follows the finger 1:1, carries the release
// velocity into a spring, lands on the photo the flick was heading for and
// stretches softly past the first and last photo.
export default function SwipeGallery({ images, activeIndex, onChange, onOpen, alt, dimmed = false }) {
  const viewportRef = useRef(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const reduce = useReducedMotion();
  const dragged = useRef(false);
  const releaseVelocity = useRef(0);

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;
    const measure = () => setWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Glide to the active photo from wherever the track is now, so arrows,
  // thumbnails and colour picks can interrupt a swipe mid-flight.
  useEffect(() => {
    if (!width) return undefined;
    const target = -activeIndex * width;
    const velocity = releaseVelocity.current;
    releaseVelocity.current = 0;
    if (reduce) { x.set(target); return undefined; }
    const spring = Math.abs(velocity) > FLICK_VELOCITY ? SPRING_FLICK : SPRING_SETTLE;
    const controls = animate(x, target, { ...spring, velocity });
    return () => controls.stop();
  }, [activeIndex, width, reduce, x]);

  const handleDragEnd = (_, info) => {
    const projected = x.get() + projectMomentum(info.velocity.x);
    const nearest = Math.round(-projected / width);
    // One photo per swipe, however hard the flick
    const next = Math.min(images.length - 1, Math.max(0, Math.min(activeIndex + 1, Math.max(activeIndex - 1, nearest))));
    releaseVelocity.current = info.velocity.x;
    if (next !== activeIndex) {
      onChange(next);
    } else {
      const spring = Math.abs(info.velocity.x) > FLICK_VELOCITY ? SPRING_FLICK : SPRING_SETTLE;
      animate(x, -activeIndex * width, reduce ? { duration: 0 } : { ...spring, velocity: info.velocity.x });
      releaseVelocity.current = 0;
    }
  };

  const multiple = images.length > 1 && width > 0;

  return (
    <div ref={viewportRef} className="h-full w-full overflow-hidden">
      {/* The moving track is its own layer, so it carries the well colour for the
          photos' multiply blend to mix with; otherwise their white boxes show mid-swipe */}
      <motion.div
        className="photo-well flex h-full"
        style={{ x }}
        drag={multiple ? 'x' : false}
        dragConstraints={{ left: -(images.length - 1) * width, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        onPointerDown={() => { dragged.current = false; }}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={handleDragEnd}
      >
        {images.map((src, index) => (
          <div key={src} className="h-full w-full shrink-0" aria-hidden={index !== activeIndex}>
            <img
              src={cloudinaryImage(src, { width: 900 })}
              srcSet={productImageSrcSet(src, [480, 720, 960])}
              sizes="(min-width: 1024px) 54vw, 100vw"
              alt={index === activeIndex ? alt : ''}
              loading={index === activeIndex ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === activeIndex ? 'high' : undefined}
              draggable={false}
              // A drag that ends on the photo is not a tap to zoom
              onClick={() => { if (!dragged.current) onOpen?.(); }}
              className={`relative h-full w-full cursor-zoom-in select-none bg-transparent object-contain p-8 mix-blend-multiply ${dimmed ? 'opacity-60' : ''}`}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
