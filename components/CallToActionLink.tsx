import { cn } from '@/lib/cn';

interface CallToActionLinkProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  as?: 'a' | 'button';
}

export default function CallToActionLink({
  href = '#',
  onClick,
  children,
  className,
  as = 'a',
}: CallToActionLinkProps) {
  const content = (
    <>
      {children}
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
      </svg>
    </>
  );

  if (as === 'button') {
    return (
      <button
        onClick={onClick}
        className={cn('stats-info-link', className)}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={cn('stats-info-link', className)}
    >
      {content}
    </a>
  );
}
