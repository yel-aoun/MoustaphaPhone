import {
  Headphones, Watch, Monitor, Mouse, Smartphone, Cable,
  Laptop, Camera, Gamepad2, Tablet, Printer, Wifi,
  Battery, Cpu, HardDrive, Keyboard, Speaker, Tv,
  Package, Tag, Zap, ShoppingBag,
} from 'lucide-react';

// Map icon name string → React component (used for dynamic rendering)
export const ICON_COMPONENTS = {
  Headphones, Watch, Monitor, Mouse, Smartphone, Cable,
  Laptop, Camera, Gamepad2, Tablet, Printer, Wifi,
  Battery, Cpu, HardDrive, Keyboard, Speaker, Tv,
  Package, Tag, Zap, ShoppingBag,
};

// Curated list shown in the icon picker
export const AVAILABLE_ICONS = [
  { name: 'Headphones', label: 'Audio' },
  { name: 'Speaker', label: 'Enceinte' },
  { name: 'Watch', label: 'Montre' },
  { name: 'Monitor', label: 'Écran' },
  { name: 'Tv', label: 'TV' },
  { name: 'Mouse', label: 'Souris' },
  { name: 'Keyboard', label: 'Clavier' },
  { name: 'Smartphone', label: 'Téléphone' },
  { name: 'Tablet', label: 'Tablette' },
  { name: 'Laptop', label: 'Ordinateur' },
  { name: 'Cable', label: 'Câble' },
  { name: 'Camera', label: 'Caméra' },
  { name: 'Gamepad2', label: 'Gaming' },
  { name: 'Printer', label: 'Imprimante' },
  { name: 'Wifi', label: 'Réseau' },
  { name: 'Battery', label: 'Batterie' },
  { name: 'Cpu', label: 'Composant' },
  { name: 'HardDrive', label: 'Stockage' },
  { name: 'Zap', label: 'Énergie' },
  { name: 'ShoppingBag', label: 'Shopping' },
  { name: 'Package', label: 'Autre' },
  { name: 'Tag', label: 'Défaut' },
];

const ICON_KEYWORDS = {
  Headphones: ['audio', 'sound', 'music', 'headphone', 'casque', 'écouteur', 'earbud', 'earphone'],
  Speaker: ['speaker', 'enceinte', 'bluetooth', 'son'],
  Watch: ['watch', 'wearable', 'montre', 'bracelet', 'fitness', 'smartwatch'],
  Monitor: ['display', 'monitor', 'screen', 'écran'],
  Tv: ['tv', 'television', 'télévision', 'télé'],
  Mouse: ['mouse', 'souris', 'peripheral', 'périphérique'],
  Keyboard: ['keyboard', 'clavier'],
  Smartphone: ['phone', 'mobile', 'smartphone', 'téléphone', 'iphone', 'android'],
  Tablet: ['tablet', 'tablette', 'ipad'],
  Laptop: ['laptop', 'computer', 'ordinateur', 'pc', 'notebook', 'macbook'],
  Cable: ['cable', 'câble', 'accessory', 'accessoire', 'charger', 'chargeur', 'adaptateur', 'adapter'],
  Camera: ['camera', 'caméra', 'photo', 'video', 'webcam'],
  Gamepad2: ['gaming', 'game', 'jeu', 'controller', 'manette', 'console', 'playstation', 'xbox'],
  Printer: ['printer', 'imprimante', 'scan', 'scanner'],
  Wifi: ['wifi', 'network', 'réseau', 'router', 'routeur', 'internet', 'modem'],
  Battery: ['battery', 'batterie', 'powerbank', 'power bank', 'power'],
  Cpu: ['cpu', 'processor', 'chip', 'composant', 'component', 'processeur'],
  HardDrive: ['storage', 'stockage', 'disk', 'disque', 'ssd', 'hdd', 'flash', 'usb'],
  Zap: ['zap', 'energy', 'énergie', 'electric', 'electrique'],
};

export function suggestIcon(name) {
  const lower = name.toLowerCase();
  for (const [icon, keywords] of Object.entries(ICON_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return 'Tag';
}
