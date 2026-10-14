export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <strong>deep</strong>
      <small>creative / digital</small>
    </span>
  );
}
