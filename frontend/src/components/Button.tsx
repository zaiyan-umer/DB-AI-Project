import { motion } from "motion/react";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
  className?: string
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  icon,
  className = ''
}: ButtonProps) {
  const baseClasses = "rounded-xl flex items-center justify-center gap-2 transition-all font-medium";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-purple-500/10",
    secondary: "bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white hover:shadow-lg hover:shadow-pink-500/10",
    outline: "border-2 border-[#667eea] text-[#667eea] hover:bg-[#667eea] hover:text-white",
    ghost: "text-gray-700 hover:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`
        ${className}
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </motion.button>
  );
}