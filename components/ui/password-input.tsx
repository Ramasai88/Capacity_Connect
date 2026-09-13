"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showStrengthIndicator?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative flex items-center">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 pr-10 text-xs shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
          className="absolute right-0 flex h-full items-center justify-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-r-lg disabled:pointer-events-none disabled:opacity-40 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-slate-500 hover:text-slate-800" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 text-slate-500 hover:text-slate-800" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
