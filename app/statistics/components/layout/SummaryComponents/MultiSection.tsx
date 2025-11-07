import { cn } from '@/lib/utils/cn';
import styles from './MultiSection.module.css';

interface MultiSectionProps {
  items: Array<{ label: string; value: string }>;
}

export default function MultiSection({ items }: MultiSectionProps) {
  return (
    <div className={cn(styles.container)}>
      {items.map((item, index) => (
        <div key={index} className={cn(styles.item)}>
          <p>
            {item.label} <span>{item.value}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
