interface LogoProps {
  src: string;
  compact?: boolean;
}

export function Logo({ src, compact = false }: LogoProps) {
  return (
    <img
      src={src}
      alt="Santa Inés"
      className={compact ? 'brand-logo brand-logo--compact' : 'brand-logo'}
    />
  );
}
