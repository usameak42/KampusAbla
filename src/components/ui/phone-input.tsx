import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, value, onChange, error, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Remove all non-digit characters except + at start
            const cleanValue = e.target.value.replace(/[^\d+]/g, "");

            // Extract just the digits (remove +90 prefix if present)
            let digits = cleanValue.replace(/^\+90/, "").replace(/\D/g, "");

            // Limit to 10 digits (Turkish mobile number without country code)
            digits = digits.substring(0, 10);

            // Format as +90 5XX XXX XX XX
            let formatted = "+90 ";

            if (digits.length > 0) {
                // First digit (should be 5)
                formatted += digits.substring(0, 1);

                if (digits.length > 1) {
                    // Next two digits
                    formatted += digits.substring(1, 3);
                }

                if (digits.length > 3) {
                    // Next three digits with space
                    formatted += " " + digits.substring(3, 6);
                }

                if (digits.length > 6) {
                    // Next two digits with space
                    formatted += " " + digits.substring(6, 8);
                }

                if (digits.length > 8) {
                    // Last two digits with space
                    formatted += " " + digits.substring(8, 10);
                }
            }

            // Update the event target value to pass upstream
            e.target.value = formatted.trim();
            onChange(e);
        };

        // Display value with underscores for empty positions
        const getDisplayValue = () => {
            if (!value || value === "+90") {
                return "+90 5__ ___ __ __";
            }

            // Extract digits from value
            const digits = value.replace(/[^\d]/g, "");

            if (digits.length === 0) {
                return "+90 5__ ___ __ __";
            }

            // Build display value with underscores
            let display = "+90 ";
            const positions = [1, 2, 3, 6, 9]; // Positions where we show underscores

            // First digit (or underscore)
            display += digits.length > 0 ? digits[0] : "5";
            display += digits.length > 1 ? digits[1] : "_";
            display += digits.length > 2 ? digits[2] : "_";

            display += " ";

            // Next 3 digits
            display += digits.length > 3 ? digits[3] : "_";
            display += digits.length > 4 ? digits[4] : "_";
            display += digits.length > 5 ? digits[5] : "_";

            display += " ";

            // Next 2 digits
            display += digits.length > 6 ? digits[6] : "_";
            display += digits.length > 7 ? digits[7] : "_";

            display += " ";

            // Last 2 digits
            display += digits.length > 8 ? digits[8] : "_";
            display += digits.length > 9 ? digits[9] : "_";

            return display;
        };

        return (
            <Input
                type="tel"
                ref={ref}
                value={value}
                onChange={handleChange}
                className={cn("font-mono", error && "border-red-500", className)}
                placeholder="+90 5__ ___ __ __"
                {...props}
            />
        );
    }
);
PhoneInput.displayName = "PhoneInput";
