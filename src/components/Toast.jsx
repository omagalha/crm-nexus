import { CheckCircle, Info, XCircle } from 'lucide-react';

const ICONS = { success: CheckCircle, error: XCircle, info: Info };

export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map(({ id, message, type }) => {
        const Icon = ICONS[type] ?? Info;
        return (
          <div key={id} className={`toast toast-${type}`} onClick={() => onDismiss(id)} title="Clique para fechar">
            <Icon size={16} />
            <span>{message}</span>
          </div>
        );
      })}
    </div>
  );
}
