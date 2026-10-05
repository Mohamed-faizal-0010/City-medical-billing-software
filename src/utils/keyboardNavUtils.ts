import React from 'react';

/**
 * Keyboard Navigation Utility for High-Speed Pharmacy Retail & Wholesale Workflows.
 * Allows pharmacy operators to bill rapidly using only the Enter key to move
 * from column to column without having to touch the mouse.
 */
export const focusNextInput = (elementId: string): boolean => {
  if (typeof document === 'undefined') return false;
  const elem = document.getElementById(elementId) as HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null;
  if (elem) {
    elem.focus();
    if ('select' in elem && typeof (elem as HTMLInputElement).select === 'function') {
      try {
        (elem as HTMLInputElement).select();
      } catch {}
    }
    return true;
  }
  return false;
};

export const onEnterMoveTo = (
  nextElementId: string,
  onCommitAction?: () => void
) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();

    if (nextElementId === '__COMMIT__' && onCommitAction) {
      onCommitAction();
      return;
    }

    const moved = focusNextInput(nextElementId);
    if (!moved && onCommitAction) {
      onCommitAction();
    }
  }
};
