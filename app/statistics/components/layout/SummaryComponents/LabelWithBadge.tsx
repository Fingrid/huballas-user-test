import { cn } from '@/lib/utils/cn';
import styles from './LabelWithBadge.module.css';

interface LabelWithBadgeProps {
  label: string;
  badgeValue: string;
  badgeType: 'success' | 'error';
}

export default function LabelWithBadge({ label, badgeValue, badgeType }: LabelWithBadgeProps) {
  return (
    <div className={cn(styles.row)}>
      <div className={cn(styles.label)}>{label}</div>
      <div className={cn(styles.badge, badgeType === 'success' ? styles.badgeSuccess : styles.badgeError)}>
        <span>{badgeValue}</span>
      </div>
    </div>
  );
}
