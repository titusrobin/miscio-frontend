// src/components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

// Define the props our input can accept - it extends all standard HTML input attributes
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

// Create our Input component using React.forwardRef to properly handle refs
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        // Combine our default styles with any custom classes passed in
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          // File input specific styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Placeholder styles
          "placeholder:text-muted-foreground",
          // Focus styles
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Any custom classes passed as props
          className
        )}
        // Set the input type and spread any remaining props
        type={type}
        ref={ref}
        {...props}
      />
    )
  }
)
// Set a display name for React DevTools
Input.displayName = "Input"

export { Input }