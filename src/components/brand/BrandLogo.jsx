import logoSrc from '@/assets/logo.png';
import { storeBrand } from '@/lib/brand';

const SIZE = {
  sm: {
    mark: 'h-8 w-8',
    image: 'h-6 w-6',
    name: 'text-lg',
    sub: 'text-[10px]',
  },
  md: {
    mark: 'h-10 w-10',
    image: 'h-7 w-7',
    name: 'text-xl',
    sub: 'text-[11px]',
  },
  lg: {
    mark: 'h-14 w-14',
    image: 'h-10 w-10',
    name: 'text-3xl',
    sub: 'text-xs',
  },
};

export default function BrandLogo({
  size = 'md',
  showText = true,
  subtitle,
  dark = false,
  className = '',
}) {
  const cfg = SIZE[size] || SIZE.md;
  const words = storeBrand.name.split(/\s+/).filter(Boolean);
  const leadingText = words.length > 1 ? `${words.slice(0, -1).join(' ')} ` : storeBrand.name.slice(0, -2);
  const accentText = words.length > 1 ? words.at(-1) : storeBrand.name.slice(-2);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`inline-flex ${cfg.mark} shrink-0 items-center justify-center rounded-lg border shadow-sm ${
          dark
            ? 'border-white/10 bg-white/[0.06] shadow-black/20'
            : 'border-border bg-background shadow-primary/10'
        }`}
      >
        <img src={logoSrc} alt={storeBrand.name} className={`${cfg.image} object-contain`} />
      </span>

      {showText && (
        <span className="min-w-0 leading-none">
          <span className={`${cfg.name} block font-extrabold tracking-normal ${dark ? 'text-white' : 'text-foreground'}`}>
            {leadingText}<span className="text-primary">{accentText}</span>
          </span>
          {subtitle && (
            <span className={`${cfg.sub} mt-1 block font-medium uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>
              {subtitle}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
