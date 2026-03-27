import { ReactNode, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface CompactDialogProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  children: ReactNode;
}

const CompactDialog = ({
  title,
  icon,
  iconColor,
  onClose,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmDisabled = false,
  size = 'sm',
  children
}: CompactDialogProps) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard handling and focus trap
  useEffect(() => {
    const dialogElement = confirmButtonRef.current?.closest('.ultra-dialog') as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Always allow Escape to close dialog regardless of focus
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel ? onCancel() : onClose();
        return;
      }

      // Handle Tab navigation - ALWAYS trap within dialog
      if (e.key === 'Tab') {
        if (!dialogElement) return;

        e.preventDefault();
        e.stopPropagation();

        const focusableElements = dialogElement.querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const focusableArray = Array.from(focusableElements) as HTMLElement[];

        if (focusableArray.length === 0) return;

        const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);
        let nextIndex;

        if (e.shiftKey) {
          // Shift+Tab - go backwards
          nextIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
        } else {
          // Tab - go forwards
          nextIndex = currentIndex >= focusableArray.length - 1 ? 0 : currentIndex + 1;
        }

        focusableArray[nextIndex]?.focus();
        return;
      }

      // Only handle Enter if focus is within dialog
      const target = e.target as HTMLElement;
      if (!dialogElement?.contains(target)) return;

      const isFormElement = target.tagName === 'INPUT' ||
                           target.tagName === 'TEXTAREA' ||
                           target.tagName === 'SELECT' ||
                           target.isContentEditable ||
                           target.closest('input, textarea, select');

      if (e.key === 'Enter' && !confirmDisabled && !isFormElement && onConfirm) {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
    };

    // Additional focus trap - prevent focus from leaving dialog
    const handleFocusOut = (e: FocusEvent) => {
      if (!dialogElement) return;

      const newFocusTarget = e.relatedTarget as HTMLElement;

      // If focus is moving outside the dialog, bring it back
      if (newFocusTarget && !dialogElement.contains(newFocusTarget)) {
        e.preventDefault();

        // Focus the first focusable element in the dialog
        const focusableElements = dialogElement.querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const firstFocusable = focusableElements[0] as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    };

    // Use capture phase to intercept ALL keyboard events
    document.addEventListener('keydown', handleKeyDown, true);

    // Add focus trap
    if (dialogElement) {
      dialogElement.addEventListener('focusout', handleFocusOut);
    }

    // Focus management - prioritize form inputs over buttons
    setTimeout(() => {
      const dialogElement = confirmButtonRef.current?.closest('.ultra-dialog');
      const firstInput = dialogElement?.querySelector('input, textarea, select') as HTMLElement;

      if (firstInput) {
        // If there's a form input, focus it
        firstInput.focus();
      } else if (confirmButtonRef.current) {
        // Otherwise focus the confirm button
        confirmButtonRef.current.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (dialogElement) {
        dialogElement.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, [onClose, onConfirm, onCancel, confirmDisabled]);

  const sizeClasses = {
    xs: 'max-w-sm',
    sm: 'max-w-md',
    md: 'max-w-lg'
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} w-full ultra-dialog rounded-xl shadow-mac26-xl overflow-hidden`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 400,
        duration: 0.2
      }}
    >
      {/* Header - Very compact */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-mac26-border-primary-light dark:border-mac26-border-primary-dark">
        <div className={`w-6 h-6 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark flex-1 truncate">
          {title}
        </h3>
        <button
          className="w-5 h-5 rounded-md hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark flex items-center justify-center text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
          onClick={onClose}
          title="Close (Esc)"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content - Compact padding */}
      <div className="px-4 py-3">
        {children}
      </div>

      {/* Footer - Compact button bar */}
      {(onConfirm || onCancel) && (
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-mac26-border-primary-light dark:border-mac26-border-primary-dark bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark">
          {onCancel && (
            <button
              className="px-3 py-1.5 text-xs font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark rounded-md transition-colors duration-150"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              ref={confirmButtonRef}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
                confirmDisabled
                  ? 'bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark cursor-not-allowed'
                  : 'bg-mac26-blue-500 hover:bg-mac26-blue-600 text-white'
              }`}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirmText}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CompactDialog;