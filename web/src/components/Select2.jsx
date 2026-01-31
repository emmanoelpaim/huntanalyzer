import { useState, useEffect, useRef } from 'react';
import { CORES } from '../config/cores';

export default function Select2({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Selecione...',
  style = {},
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const optionsFiltrados = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => 
        prev < optionsFiltrados.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && optionsFiltrados[selectedIndex]) {
        handleSelect(optionsFiltrados[selectedIndex]);
      } else if (!isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const displayValue = value || '';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          fontSize: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : CORES.branco,
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '28px',
          ...style
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => {
            if (!disabled) {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            fontSize: '10px',
            backgroundColor: 'transparent',
            cursor: disabled ? 'not-allowed' : 'text',
            width: '100%'
          }}
        />
        <span style={{
          marginLeft: '8px',
          fontSize: '10px',
          color: '#666',
          userSelect: 'none'
        }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: CORES.branco,
          border: '1px solid #ccc',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          marginTop: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {optionsFiltrados.length > 0 ? (
            optionsFiltrados.map((option, index) => (
              <div
                key={index}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: '8px 10px',
                  cursor: 'pointer',
                  backgroundColor: selectedIndex === index ? '#e3f2fd' : 'transparent',
                  borderBottom: index < optionsFiltrados.length - 1 ? '1px solid #eee' : 'none',
                  fontSize: '10px',
                  color: CORES.preto,
                  transition: 'background-color 0.2s'
                }}
              >
                {option}
              </div>
            ))
          ) : (
            <div style={{
              padding: '10px',
              fontSize: '10px',
              color: '#666',
              textAlign: 'center'
            }}>
              Nenhuma opção encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
