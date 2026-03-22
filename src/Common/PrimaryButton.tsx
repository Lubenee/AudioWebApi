import type { ReactNode } from "react";

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
}

export default function PrimaryButton({ onClick, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-32 h-20
        bg-purple-600
        text-purple-100
        font-mono tracking-wide
        border-4 border-purple-900
        flex items-center justify-center
        shadow-retro
        transition-all
        hover:bg-purple-500
        active:translate-x-0.5
        active:translate-y-0.5
        active:shadow-none
        cursor-pointer
        select-none
      "
    >
      {children}
    </button>
  );
}
