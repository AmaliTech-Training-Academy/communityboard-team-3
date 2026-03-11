import type { ReactNode } from 'react';
import { Button, Text } from '@/components/ui';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isConfirming = false,
  icon,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[384px] rounded-lg border border-default bg-surface px-5 py-6 shadow-lg md:max-w-[480px] md:px-6">
        <div className="flex items-start gap-3 pb-4">
          {icon ? <div className="mt-1">{icon}</div> : null}
          <div className="space-y-1">
            <Text
              as="h2"
              variant="bodyBase"
              className="text-primary text-lg font-semibold leading-7"
            >
              {title}
            </Text>
            {description ? (
              <Text variant="bodySmRegular" className="text-secondary">
                {description}
              </Text>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isConfirming}
            className="sm:w-[140px]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={isConfirming}
            disabled={isConfirming}
            className="sm:w-[140px]"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

