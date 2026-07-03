export default function Pagination({ page = 1, totalPages = 1, onPrev, onNext }) {
  return (
    <div className="pagination">
      <button type="button" onClick={onPrev} disabled={page <= 1} aria-label="Pagina anterior">
        ‹
      </button>
      <span>
        Pagina {page} de {totalPages}
      </span>
      <button type="button" onClick={onNext} disabled={page >= totalPages} aria-label="Pagina siguiente">
        ›
      </button>
    </div>
  );
}
