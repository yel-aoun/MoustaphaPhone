import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';

export default function CategoryBar({ active, onSelect, productCounts = {} }) {
  const scrollRef = useRef(null);
  const [leftFade, setLeftFade] = useState(false);
  const [rightFade, setRightFade] = useState(false);
  const { data: categories = [] } = useCategories();

  const total = Object.values(productCounts).reduce((s, n) => s + n, 0);
  const filters = [
    { name: 'Tous', icon: null, count: total },
    ...categories.map((c) => ({ ...c, count: productCounts[c.name] || 0 })),
  ];

  // Detect actual overflow and scroll position for conditional fades
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 2;
    setLeftFade(overflows && el.scrollLeft > 8);
    setRightFade(overflows && el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [filters.length]);

  return (
    <div className="relative">
      {leftFade && (
        <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-1.5 overflow-x-auto py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filters.map(({ name, icon, count }) => {
          const isActive = active === name;
          const Icon = icon ? (ICON_COMPONENTS[icon] ?? null) : null;
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="category-pill"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {name}
                {count > 0 && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {rightFade && (
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent" />
      )}
    </div>
  );
}
