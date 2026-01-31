import { useState, useEffect, useRef } from 'react';
import { CORES } from '../config/cores';

export default function SelectDerrotadoModal({ derrotados, onSelect, onCancel }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const derrotadosFiltrados = derrotados.filter(d =>
    d.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (derrotado) => {
    onSelect(derrotado);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < derrotadosFiltrados.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (derrotadosFiltrados[selectedIndex]) {
        handleSelect(derrotadosFiltrados[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  useEffect(() => {
    setIsOpen(true);
    setSearchTerm('');
    setSelectedIndex(0);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: CORES.branco,
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        minWidth: '400px',
        maxWidth: '600px',
        maxHeight: '80vh',
        zIndex: 10001
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: CORES.preto
        }}>
          Selecione o nome do derrotado:
        </h3>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite para buscar..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '12px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />

          {isOpen && derrotadosFiltrados.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: CORES.branco,
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 10002,
                marginTop: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {derrotadosFiltrados.map((derrotado, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(derrotado)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedIndex === index ? '#e3f2fd' : 'transparent',
                    borderBottom: index < derrotadosFiltrados.length - 1 ? '1px solid #eee' : 'none',
                    fontSize: '12px',
                    color: CORES.preto
                  }}
                >
                  {derrotado}
                </div>
              ))}
            </div>
          )}

          {derrotadosFiltrados.length === 0 && searchTerm && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: CORES.branco,
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '10px',
              marginTop: '4px',
              fontSize: '12px',
              color: '#666'
            }}>
              Nenhum derrotado encontrado
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: '#999',
              color: CORES.branco,
              border: 'none',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          {derrotadosFiltrados.length > 0 && (
            <button
              onClick={() => handleSelect(derrotadosFiltrados[selectedIndex])}
              style={{
                backgroundColor: CORES.botao,
                color: CORES.branco,
                border: 'none',
                padding: '10px 20px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Selecionar
            </button>
          )}
        </div>

        {derrotadosFiltrados.length > 0 && (
          <div style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}>
            Use as setas ↑↓ para navegar, Enter para selecionar, Esc para cancelar
          </div>
        )}
      </div>
    </div>
  );
}
