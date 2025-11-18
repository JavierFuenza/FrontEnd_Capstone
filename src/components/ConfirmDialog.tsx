import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmDialogProps) {
  const config = {
    danger: {
      gradient: 'from-red-500 to-red-600',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      iconColor: 'text-red-600'
    },
    warning: {
      gradient: 'from-amber-500 to-amber-600',
      buttonColor: 'bg-amber-600 hover:bg-amber-700',
      iconColor: 'text-amber-600'
    },
    info: {
      gradient: 'from-blue-500 to-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      iconColor: 'text-blue-600'
    }
  };

  const { gradient, buttonColor, iconColor } = config[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${gradient} text-white px-6 py-4 rounded-t-xl`}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {title}
          </h3>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Botones de acción */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="px-6"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`${buttonColor} text-white px-6`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
