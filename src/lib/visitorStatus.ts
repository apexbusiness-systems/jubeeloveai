const FIRST_VISIT_KEY = 'jubee_has_visited';

export function markAsReturningVisitor() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FIRST_VISIT_KEY, 'true');
}

export function isFirstTimeVisitor(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FIRST_VISIT_KEY) !== 'true';
}
