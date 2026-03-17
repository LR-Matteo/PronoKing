import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '@/lib/utils';

// ==================== BUTTON ====================
export function Button({
  children,
  variant = 'gold',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const base = 'btn';
  const variants = {
    gold: 'btn-gold',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  return (
    <button
      className={classNames(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// ==================== BADGE ====================
export function Badge({ children, color = 'gold', className = '' }) {
  const colors = {
    gold: 'badge-gold',
    green: 'badge-green',
    red: 'badge-red',
    blue: 'badge-blue',
    cyan: 'badge-cyan',
  };

  return (
    <span className={classNames('badge', colors[color], className)}>
      {children}
    </span>
  );
}

// ==================== INPUT ====================
export function Input({ label, className = '', ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input className={classNames('input-field', className)} {...props} />
    </div>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <select className={classNames('input-field', className)} {...props}>
        {children}
      </select>
    </div>
  );
}

// ==================== MODAL ====================
export function Modal({ open, onClose, children, title }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && <h2>{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==================== MESSAGE ====================
export function Message({ type = 'error', children }) {
  if (!children) return null;
  return <div className={type === 'error' ? 'msg-error' : 'msg-success'}>{children}</div>;
}

// ==================== EMPTY STATE ====================
export function EmptyState({ icon, title, description, children }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ marginBottom: 12 }}>{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

// ==================== TOKEN COIN ====================
export function TokenCoin({ size = 18 }) {
  return (
    <span
      className="token-coin"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      J
    </span>
  );
}

// ==================== PAGE TRANSITION WRAPPER ====================
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
