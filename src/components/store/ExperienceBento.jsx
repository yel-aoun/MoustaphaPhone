import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MessageCircle, RotateCcw, Sparkles, Wallet } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import { slugify } from '@/lib/products';
import { buildWhatsAppLink, storeBrand } from '@/lib/brand';
import { BRANDS } from '@/components/store/BrandStrip';
import CircuitBackground from '@/components/store/fx/CircuitBackground';
import CountUp from '@/components/store/fx/CountUp';
import Reveal from '@/components/store/fx/Reveal';
import { trackSpotlight } from '@/components/store/fx/spotlight';

const BUDGETS = [
  { label: 'Moins de 500 MAD', min: '', max: '500' },
  { label: '500 – 2 000 MAD', min: '500', max: '2000' },
  { label: '2 000 – 8 000 MAD', min: '2000', max: '8000' },
  { label: 'Plus de 8 000 MAD', min: '8000', max: '' },
  { label: 'Peu importe', min: '', max: '' },
];

// Approximate positions (lon/lat) projected into the tile
const CITIES = [
  ['Tanger', -5.8, 35.77], ['Tétouan', -5.37, 35.57], ['Oujda', -1.91, 34.68], ['Fès', -5.0, 34.03],
  ['Rabat', -6.84, 34.02], ['Casablanca', -7.59, 33.57], ['Marrakech', -7.99, 31.63], ['Agadir', -9.6, 30.42],
  ['Laâyoune', -13.2, 27.15],
];
const project = (lon, lat) => [((lon + 14) / 13) * 100, ((36.5 - lat) / 10) * 100];

const tile = 'spotlight relative overflow-hidden rounded-3xl border border-border bg-card p-4 sm:p-6';

function ProductFinder({ products }) {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(null);
  const [budget, setBudget] = useState(null);
  const [brand, setBrand] = useState(null);

  const brands = useMemo(() => {
    const names = products.map((p) => (p.name || '').toLowerCase());
    return BRANDS.filter((b) => names.some((n) => b.keywords.some((k) => n.includes(k))));
  }, [products]);

  const matches = useMemo(() => products.filter((p) => {
    if (category && p.category !== category) return false;
    if (budget?.min && p.price < Number(budget.min)) return false;
    if (budget?.max && p.price > Number(budget.max)) return false;
    if (brand && !brand.keywords.some((k) => (p.name || '').toLowerCase().includes(k))) return false;
    return true;
  }), [products, category, budget, brand]);

  const showResults = () => {
    const params = new URLSearchParams();
    if (budget?.min) params.set('min', budget.min);
    if (budget?.max) params.set('max', budget.max);
    if (brand) {
      const names = products.map((p) => (p.name || '').toLowerCase());
      const best = brand.keywords.map((k) => [k, names.filter((n) => n.includes(k)).length]).sort((a, b) => b[1] - a[1])[0][0];
      params.set('q', best);
    }
    const query = params.toString();
    navigate(`${category ? `/category/${slugify(category)}` : '/boutique'}${query ? `?${query}` : ''}`);
  };

  const reset = () => { setStep(0); setCategory(null); setBudget(null); setBrand(null); };
  const choice = (selected) => `flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all active:scale-[0.97] ${
    selected ? 'border-foreground bg-foreground text-background' : 'border-border bg-background/70 text-foreground hover:border-foreground/40'
  }`;

  const steps = [
    {
      title: 'Vous cherchez…',
      body: (
        <div className="grid grid-cols-2 gap-2">
          {[{ name: null, label: 'Un peu de tout' }, ...categories.map((c) => ({ name: c.name, label: c.name, icon: c.icon }))].map(({ name, label, icon }) => {
            const Icon = icon ? ICON_COMPONENTS[icon] : Sparkles;
            return (
              <button key={label} type="button" onClick={() => { setCategory(name); setStep(1); }} className={choice(category === name && step > 0)}>
                <Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: 'Votre budget ?',
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {BUDGETS.map((b) => (
            <button key={b.label} type="button" onClick={() => { setBudget(b); setStep(brands.length > 0 ? 2 : 3); }} className={choice(budget?.label === b.label)}>
              {b.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Une marque préférée ?',
      body: (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...brands, null].map((b) => (
            <button key={b?.name || 'any'} type="button" onClick={() => { setBrand(b); setStep(3); }} className={choice(brand?.name === b?.name && step > 2)}>
              {b?.name || 'Peu importe'}
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className={`${tile} col-span-2 flex min-h-[420px] flex-col md:row-span-2`} onPointerMove={trackSpotlight}>
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 animate-aurora rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 animate-aurora rounded-full bg-sky-400/20 blur-3xl [animation-delay:-6s]" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Trouver mon produit
        </span>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`} />
          ))}
        </div>
      </div>

      <div className="relative mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step < 3 ? (
              <>
                <h3 className="mb-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{steps[step].title}</h3>
                {steps[step].body}
              </>
            ) : (
              <div className="flex h-full flex-col justify-center">
                <p className="text-sm text-muted-foreground">Nous avons trouvé</p>
                <p className="mt-1 text-6xl font-semibold tracking-tight text-foreground">
                  <CountUp to={matches.length} duration={0.9} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  produit{matches.length !== 1 ? 's' : ''} pour vous{category ? ` en ${category}` : ''}{brand ? ` · ${brand.name}` : ''}.
                </p>
                <button
                  type="button"
                  onClick={showResults}
                  className="group mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-primary pl-6 pr-2 text-sm font-medium text-primary-foreground"
                >
                  {matches.length > 0 ? 'Voir les résultats' : 'Voir la boutique'}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mt-5 flex items-center justify-between text-sm">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => (s === 3 && brands.length === 0 ? 1 : s - 1))} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
        ) : <span />}
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{matches.length}</span> correspondance{matches.length !== 1 ? 's' : ''}
          {step > 0 && <button type="button" onClick={reset} className="ml-3 text-primary hover:underline">Recommencer</button>}
        </span>
      </div>
    </div>
  );
}

export default function ExperienceBento({ products = [] }) {
  return (
    <section className="container-store py-14 sm:py-20">
      <Reveal>
        <h2 className="section-title">L’expérience {storeBrand.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Trouvez le bon produit, commandez en un message, payez à la porte.</p>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
        <ProductFinder products={products} />

        {/* WhatsApp live */}
        <a
          href={buildWhatsAppLink(`Bonjour ${storeBrand.name}, j'ai besoin d'un conseil.`)}
          target="_blank"
          rel="noopener noreferrer"
          onPointerMove={trackSpotlight}
          className={`${tile} group flex flex-col justify-between`}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Conseiller disponible
          </div>
          <div className="my-5 space-y-2">
            <div className="w-fit max-w-[95%] rounded-2xl rounded-bl-md bg-secondary px-3 py-2 text-xs text-foreground sm:max-w-[85%] sm:text-sm">Salam ! Quelle coque pour l’iPhone 17 ?</div>
            <div className="ml-auto flex w-fit items-center gap-1 rounded-2xl rounded-br-md bg-[#25D366] px-3 py-2.5">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-typing rounded-full bg-white" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-semibold text-foreground">Conseil sur WhatsApp</p>
              <p className="text-xs text-muted-foreground">{storeBrand.supportHours}</p>
            </div>
            <MessageCircle className="h-5 w-5 text-muted-foreground transition-transform group-hover:-rotate-12 group-hover:text-[#25D366]" />
          </div>
        </a>

        {/* Delivery map */}
        <div className={`${tile} flex flex-col justify-between`} onPointerMove={trackSpotlight}>
          <CircuitBackground className="text-foreground opacity-40" pulses={false} />
          <div className="relative h-28 sm:h-36">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {CITIES.filter(([name]) => name !== 'Casablanca').map(([name, lon, lat]) => {
                const [x, y] = project(lon, lat);
                const [cx, cy] = project(-7.59, 33.57);
                return <line key={name} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(var(--primary))" strokeOpacity="0.25" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />;
              })}
            </svg>
            {CITIES.map(([name, lon, lat], i) => {
              const [x, y] = project(lon, lat);
              return (
                <span key={name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }} title={name}>
                  <span className="absolute inset-0 animate-ping-slow rounded-full bg-primary/50" style={{ animationDelay: `${i * 0.3}s` }} />
                  <span className={`relative block rounded-full bg-primary ${name === 'Casablanca' ? 'h-3 w-3 ring-4 ring-primary/20' : 'h-2 w-2'}`} />
                </span>
              );
            })}
          </div>
          <div className="relative">
            <p className="font-semibold text-foreground">Livraison partout</p>
            <p className="text-xs text-muted-foreground">De Tanger à Laâyoune, en 24–72h.</p>
          </div>
        </div>

        {/* Cash on delivery */}
        <div className={`${tile} flex flex-col justify-between`} onPointerMove={trackSpotlight}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"><CountUp to={0} />&nbsp;<span className="text-2xl text-muted-foreground">MAD</span></p>
            <p className="mt-1 font-semibold text-foreground">À payer en ligne</p>
            <p className="text-xs text-muted-foreground">Vous payez en cash, à la réception.</p>
          </div>
        </div>

        {/* Return ring */}
        <div className={`${tile} flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5`} onPointerMove={trackSpotlight}>
          <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round"
                pathLength="1" strokeDasharray="1"
                initial={{ strokeDashoffset: 1 }}
                whileInView={{ strokeDashoffset: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-foreground"><CountUp to={7} /></span>
              <span className="text-[10px] text-muted-foreground">jours</span>
            </span>
          </div>
          <div>
            <p className="flex items-center gap-1.5 font-semibold text-foreground"><RotateCcw className="h-4 w-4 text-primary" /> Retour facile</p>
            <p className="mt-1 text-xs text-muted-foreground">Produit intact ? Vous avez 7 jours pour changer d’avis.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
