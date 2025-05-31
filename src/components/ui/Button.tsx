"use client";

import { motion } from "framer-motion";
import { forwardRef, ReactNode } from "react";

type ButtonBaseProps = {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
};

type ButtonProps = ButtonBaseProps &
  Omit<React.ComponentProps<typeof motion.button>, keyof ButtonBaseProps>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantStyles = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
      secondary:
        "bg-primary-100 text-primary-700 hover:bg-primary-200 focus:ring-primary-500",
      outline:
        "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const disabledStyles = "opacity-60 cursor-not-allowed";
    const widthStyles = fullWidth ? "w-full" : "";

    const computedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${disabled || isLoading ? disabledStyles : ""}
      ${widthStyles}
      ${className}
    `.trim();

    const buttonVariants = {
      hover: { scale: 1.03 },
      tap: { scale: 0.98 },
    };

    return (
      <motion.button
        ref={ref}
        className={computedClassName}
        disabled={disabled || isLoading}
        whileHover="hover"
        whileTap="tap"
        variants={buttonVariants}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        {...props}
      >
        {isLoading && (
          <svg
            className="w-5 h-5 mr-2 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            />
          </svg>
        )}

        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
