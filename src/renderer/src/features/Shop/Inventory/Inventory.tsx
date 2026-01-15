import { PokedexEntry } from '../../../types';
import './Inventory.css';

interface InventoryProps {
  pokedex: PokedexEntry[];
  active: string;
  onSelect: (id: string) => void;
  xpData: Record<string, number>;
}

export default function Inventory({ pokedex, active, onSelect, xpData }: InventoryProps): JSX.Element {
  return (
    <div className="inventory-container">
      {pokedex.map((p) => (
        <div
          key={p.id}
          className={`inventory-item ${p.id === active ? 'active' : ''}`}
          onClick={() => onSelect(p.id)}
        >
          {p.label}
          <div className="inventory-xp">XP: {xpData[p.id] ?? 0}</div>
        </div>
      ))}
    </div>
  );
}
