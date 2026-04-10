import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export default function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  icon: Icon,
  textarea = false,
  rows = 4,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const inputClasses = [
    'input-group__input',
    Icon && 'input-group__input--has-icon',
    isPassword && 'input-group__input--has-icon-right',
    textarea && 'input-group__input--textarea',
  ]
    .filter(Boolean)
    .join(' ');

  const InputTag = textarea ? 'textarea' : 'input';

  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className={`input-group__label ${required ? 'input-group__label--required' : ''}`}
        >
          {label}
        </label>
      )}

      <div className="input-group__wrapper">
        {Icon && (
          <span className="input-group__icon">
            <Icon size={18} />
          </span>
        )}

        <InputTag
          id={name}
          name={name}
          type={textarea ? undefined : inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          rows={textarea ? rows : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-group__icon-right"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <span id={`${name}-error`} className="input-group__error" role="alert">
          {error}
        </span>
      )}

      {hint && !error && (
        <span id={`${name}-hint`} className="input-group__hint">
          {hint}
        </span>
      )}
    </div>
  );
}
