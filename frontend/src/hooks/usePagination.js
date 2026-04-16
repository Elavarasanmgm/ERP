import { useState } from 'react';

export const ROWS_PER_PAGE = 10;

/**
 * usePagination — filters + paginates a list
 * @param {Array}    list      — full data array
 * @param {Function} filterFn  — optional (item, query) => bool
 * @returns { page, setPage, search, setSearch, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange }
 */
export default function usePagination(list, filterFn) {
  const [page, setPage]     = useState(0);
  const [search, setSearch] = useState('');

  const filtered = filterFn && search
    ? list.filter(item => filterFn(item, search.toLowerCase()))
    : list;

  const pageRows = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const handleSearchChange = e => { setSearch(e.target.value); setPage(0); };

  return { page, setPage, search, setSearch, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange };
}
