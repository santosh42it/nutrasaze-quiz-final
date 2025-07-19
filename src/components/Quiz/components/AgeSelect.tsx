import React from "react";

interface AgeSelectProps {
  options?: string[];
  value: string;
  onChange: (value: string) => void;
}

export const AgeSelect: React.FC<AgeSelectProps> = ({ options, value, onChange }) => {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-6 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-white appearance-none cursor-pointer"
      >
        <option value="">Select your age</option>
        {options?.map((age) => (
          <option key={age} value={age}>
            {age} years
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
};