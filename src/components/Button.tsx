import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "danger";

const VARIANTS: Record<Variant, string> = {
  default: "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
  primary: "border-blue-500 bg-blue-500 text-white hover:bg-blue-600",
  danger: "border-red-100 bg-red-50 text-red-500 hover:bg-red-100",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** 툴바·헤더에서 쓰는 작은 버튼 */
export function Button({ variant = "default", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-[7px] border px-3 py-1.5 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
