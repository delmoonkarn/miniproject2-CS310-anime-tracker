import { useMediaQuery } from './useMediaQuery';

/** Columns of GRID_CLASSES at the current width (2 → 6, following Tailwind's sm/md/lg/xl breakpoints). */
export function useGridColumns(): number {
  const sm = useMediaQuery('(min-width: 40rem)');
  const md = useMediaQuery('(min-width: 48rem)');
  const lg = useMediaQuery('(min-width: 64rem)');
  const xl = useMediaQuery('(min-width: 80rem)');
  return xl ? 6 : lg ? 5 : md ? 4 : sm ? 3 : 2;
}
