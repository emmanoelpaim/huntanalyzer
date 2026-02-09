import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ message, type }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#4CAF50', color: '#fff' };
      case 'error':
        return { backgroundColor: '#f44336', color: '#fff' };
      case 'warning':
        return { backgroundColor: '#FF9800', color: '#fff' };
      default:
        return { backgroundColor: '#2196F3', color: '#fff' };
    }
  };

  return (
    <div
      style={{
        ...getTypeStyles(),
        padding: '12px 20px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '14px',
        maxWidth: '400px',
        wordWrap: 'break-word',
        animation: 'slideIn 0.3s ease-out',
        pointerEvents: 'auto'
      }}
    >
      {message}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
