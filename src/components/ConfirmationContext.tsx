"use client";
import React, { createContext, useContext, useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';

interface ConfirmationContextType {
  customConfirm: (title: string, message: string, options?: { confirmLabel?: string, confirmVariant?: 'danger' | 'primary' | 'success' }) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'success';
  }>({ isOpen: false, onConfirm: () => {}, title: '', message: '' });

  const customConfirm = (title: string, message: string, options?: { confirmLabel?: string, confirmVariant?: 'danger' | 'primary' | 'success' }) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        isOpen: true,
        onConfirm: () => resolve(true),
        title,
        message,
        confirmLabel: options?.confirmLabel,
        confirmVariant: options?.confirmVariant
      });
    });
  };

  return (
    <ConfirmationContext.Provider value={{ customConfirm }}>
      {children}
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={() => { modal.onConfirm(); setModal({ ...modal, isOpen: false }); }}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.confirmLabel}
        confirmVariant={modal.confirmVariant}
      />
    </ConfirmationContext.Provider>
  );
};

export const useCustomConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error('useCustomConfirm must be used within a ConfirmationProvider');
  return context.customConfirm;
};
