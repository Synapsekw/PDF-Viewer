import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { UserSettings } from '../types';

interface ThemeSelectorProps {
  value: UserSettings['theme'];
  onChange: (theme: UserSettings['theme']) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ value, onChange }) => {
  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun, description: 'Light theme for day use' },
    { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Dark theme for night use' },
    { value: 'system' as const, label: 'System', icon: Monitor, description: 'Match system preference' },
  ];

  return (
    <div className="space-y-3">
      {themes.map((theme) => (
        <label
          key={theme.value}
          className={`
            flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all
            ${value === theme.value 
              ? 'bg-slate-700/50 border-2 border-slate-500' 
              : 'bg-slate-800/30 border-2 border-transparent hover:bg-slate-700/30'
            }
          `}
        >
          <input
            type="radio"
            name="theme"
            value={theme.value}
            checked={value === theme.value}
            onChange={() => onChange(theme.value)}
            className="sr-only"
          />
          <theme.icon className={`w-5 h-5 ${value === theme.value ? 'text-slate-300' : 'text-slate-500'}`} />
          <div className="flex-1">
            <div className={`font-medium ${value === theme.value ? 'text-slate-200' : 'text-slate-400'}`}>
              {theme.label}
            </div>
            <div className="text-sm text-slate-500">
              {theme.description}
            </div>
          </div>
          <div className={`
            w-4 h-4 rounded-full border-2 
            ${value === theme.value 
              ? 'bg-slate-400 border-slate-400' 
              : 'border-slate-600'
            }
          `} />
        </label>
      ))}
    </div>
  );
};
