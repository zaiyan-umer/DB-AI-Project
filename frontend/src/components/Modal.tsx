<<<<<<< HEAD
import type { ReactNode } from "react";
=======
import { type ReactNode, useEffect } from "react";
>>>>>>> main
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

<<<<<<< HEAD
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
=======
const sizeMap = {
  sm: '448px',
  md: '560px',
  lg: '672px',
  xl: '896px',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
>>>>>>> main

  return (
    <AnimatePresence>
      {isOpen && (
        <>
<<<<<<< HEAD
=======
          {/* Backdrop — covers full viewport */}
>>>>>>> main
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
<<<<<<< HEAD
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
=======
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />

          {/* Centering wrapper — also fixed, above backdrop */}
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 101,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            pointerEvents: 'none',   // let clicks pass through to backdrop except on panel
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: sizeMap[size],
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid #f3f4f6',
                flexShrink: 0,
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    padding: '6px', borderRadius: '8px', border: 'none',
                    background: 'transparent', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
                >
                  <X className="w-5 h-5" style={{ color: '#6b7280' }} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
>>>>>>> main
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> main
