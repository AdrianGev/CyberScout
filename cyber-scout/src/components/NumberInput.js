import React from 'react';

function NumberInput({ 
  value, 
  onChange, 
  min = 0, 
  max = Infinity, 
  step = 1,
  name,
  id,
  className = '',
  style = {},
  required = false,
  disabled = false,
  placeholder = ''
}) {
  const handleIncrement = () => {
    const newValue = Number(value || 0) + step;
    if (newValue <= max) {
      onChange({ target: { name, value: newValue } });
    }
  };

  const handleDecrement = () => {
    const newValue = Number(value || 0) - step;
    if (newValue >= min) {
      onChange({ target: { name, value: newValue } });
    }
  };

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(e);
    }
  };

  return (
    <div className="d-flex align-items-stretch position-relative" style={{ minWidth: '160px', ...style }}>
      <input
        type="number"
        className={`form-control text-center ${className}`}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        name={name}
        id={id}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #212529',
          paddingRight: '140px',
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
        }}
      />
      <div className="position-absolute end-0 d-flex h-100" style={{ pointerEvents: 'none'}}>
        <button 
          className="btn"
          type="button" 
          onClick={handleDecrement}
          disabled={disabled || Number(value || 0) <= min}
          style={{
            backgroundColor: '#e9ecef',
            border: '1px solid #212529',
            borderLeft: 'none',
            borderRadius: '0',
            height: '100%',
            width: '70px',
            padding: '0',
            pointerEvents: 'auto',
            color: '#212529',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="bi bi-dash" style={{ fontSize: '1.25rem' }}></i>
        </button>
        <button 
          className="btn"
          type="button" 
          onClick={handleIncrement}
          disabled={disabled || Number(value || 0) >= max}
          style={{
            backgroundColor: '#e9ecef',
            border: '1px solid #212529',
            borderLeft: 'none',
            borderRadius: '0 0.375rem 0.375rem 0',
            height: '100%',
            width: '70px',
            padding: '0',
            pointerEvents: 'auto',
            color: '#212529',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="bi bi-plus" style={{ fontSize: '1.25rem' }}></i>
        </button>
      </div>
      <style jsx>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

export default NumberInput;
