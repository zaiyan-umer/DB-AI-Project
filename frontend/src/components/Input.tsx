import type { ReactNode } from "react";

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: ReactNode;
  required?: boolean;
  error?: string;
}

export function Input({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  icon,
  required = false,
  error
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm mb-2 text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`
            w-full px-4 py-3 ${icon ? 'pl-12' : ''} rounded-xl border border-gray-200
            focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent
            transition-all bg-white
            ${error ? 'border-red-500' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
