/**
 * Sort Dropdown Component - Sort search results
 */

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type SortOption =
    | "relevance"
    | "distance"
    | "price-asc"
    | "price-desc"
    | "rating"
    | "experience";

interface SortDropdownProps {
    value: SortOption;
    onChange: (value: SortOption) => void;
}

const sortOptions = [
    { value: "relevance" as const, label: "İlgililik" },
    { value: "distance" as const, label: "Mesafe (yakın)" },
    { value: "price-asc" as const, label: "Fiyat (düşükten yükseğe)" },
    { value: "price-desc" as const, label: "Fiyat (yüksekten düşüğe)" },
    { value: "rating" as const, label: "Puan (yüksekten düşüğe)" },
    { value: "experience" as const, label: "Deneyim (en fazla)" },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sırala" />
            </SelectTrigger>
            <SelectContent>
                {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
