"use client";

import { useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function Printable({ children, className = "", title }: Props) {
  return (
    <div className={`printable ${className}`} data-print-title={title}>
      {children}
    </div>
  );
}

export function usePrint() {
  return () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };
}

export function usePrintRef() {
  const ref = useRef<HTMLDivElement>(null);
  return ref;
}
