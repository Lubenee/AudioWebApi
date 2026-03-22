import { useState } from "react";

type CheckboxProps = {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export function Checkbox({
  label,
  checked = false,
  onChange,
}: CheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const toggle = () => {
    const next = !isChecked;
    setIsChecked(next);
    onChange?.(next);
  };

  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      {/* Hidden native checkbox */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={toggle}
        className="sr-only"
      />

      {/* Custom checkbox */}
      <div
        className={`
          relative h-6 w-6
          border-4 border-purple-900
          bg-purple-200
          shadow-retro-sm
          transition-all
          ${isChecked ? "bg-purple-600 shadow-none translate-x-px translate-y-px" : ""}
        `}
      >
        {isChecked && (
          <div className="absolute inset-1 bg-purple-100" />
        )}
      </div>

      {/* Label */}
      <span className="font-mono text-purple-900 tracking-wide">
        {label}
      </span>
    </label>
  );
}
