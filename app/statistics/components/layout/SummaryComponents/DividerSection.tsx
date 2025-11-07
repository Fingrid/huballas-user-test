import { cn } from '@/lib/utils/cn';
import styles from './DividerSection.module.css';

interface DividerSectionProps {
  children: React.ReactNode;
}

export default function DividerSection({ children }: DividerSectionProps) {
  return (
    <div className={cn(styles.section)}>
      <p>{children}</p>
    </div>
  );
}
