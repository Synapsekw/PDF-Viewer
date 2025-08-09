import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption<T = string> {
  value: T;
  label: string;
  description?: string;
}

interface DropdownSettingProps<T = string> {
  label: string;
  description?: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function DropdownSetting<T = string>({ 
  label, 
  description, 
  value, 
  options, 
  onChange,
  disabled = false 
}: DropdownSettingProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-4 rounded-lg bg-slate-800/30">
      <label className="block mb-2">
        <div className="font-medium text-slate-200">{label}</div>
        {description && (
          <div className="text-sm text-slate-500 mt-1">{description}</div>
        )}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between px-4 py-2 text-left 
            bg-slate-700/50 rounded-lg text-slate-300
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700 cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
          `}
        >
          <span>{selectedOption?.label || 'Select...'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            {options.map((option) => (
              <button
                key={String(option.value)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors
                  ${option.value === value ? 'bg-slate-700/50' : ''}
                `}
              >
                <div className="font-medium text-slate-200">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
