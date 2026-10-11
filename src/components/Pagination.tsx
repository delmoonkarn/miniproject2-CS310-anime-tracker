interface Props {
  offset: number;
  pageSize: number;
  /** null when the total is unknown; then "Next" stays enabled while pages are full. */
  total: number | null;
  shown: number;
  onChange: (offset: number) => void;
}

export function Pagination({ offset, pageSize, total, shown, onChange }: Props) {
  const page = Math.floor(offset / pageSize) + 1;
  const pages = total === null ? null : Math.max(1, Math.ceil(total / pageSize));
  const hasNext = pages === null ? shown === pageSize : page < pages;

  return (
    <nav className="join mt-8 flex justify-center" aria-label="Pagination">
      <button
        type="button"
        className="btn join-item"
        disabled={offset === 0}
        onClick={() => onChange(Math.max(0, offset - pageSize))}
      >
        « Prev
      </button>
      <span className="btn join-item no-animation pointer-events-none">
        Page {page}
        {pages !== null && ` of ${pages}`}
      </span>
      <button type="button" className="btn join-item" disabled={!hasNext} onClick={() => onChange(offset + pageSize)}>
        Next »
      </button>
    </nav>
  );
}
