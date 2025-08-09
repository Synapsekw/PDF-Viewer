import React from 'react';

interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({ 
  label, 
  description, 
  checked, 
  onChange,
  disabled = false 
}) => {
  return (
    <label className={`flex items-center justify-between p-4 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="flex-1 pr-4">
        <div className="font-medium text-slate-200">{label}</div>
        {description && (
          <div className="text-sm text-slate-500 mt-1">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-slate-600' : 'bg-slate-700'}
          ${disabled ? '' : 'focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-900'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  );
};
