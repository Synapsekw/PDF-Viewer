import React from 'react';
import { usePdf } from '../../pdf/PdfContext';

export const Navigation: React.FC = () => {
  const { currentPage, totalPages, setCurrentPage } = usePdf();

  const goToPreviousPage = () => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  };

  return (
    <div className="navigation">
      <button
        onClick={goToPreviousPage}
        disabled={currentPage <= 1}
      >
        Previous
      </button>
      <span className="page-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={goToNextPage}
        disabled={currentPage >= totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Navigation;