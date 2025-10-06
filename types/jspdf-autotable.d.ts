declare module "jspdf-autotable" {
  import type { jsPDF } from "jspdf";

  export interface AutoTableUserOptions {
    head?: unknown[][];
    body?: unknown[][];
    foot?: unknown[][];
    theme?: "striped" | "grid" | "plain";
    styles?: Record<string, unknown>;
    columnStyles?: Record<string, unknown>;
    didDrawPage?: (data: unknown) => void;
    startY?: number;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  }

  export default function autoTable(
    doc: jsPDF,
    options: AutoTableUserOptions
  ): jsPDF;
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: import("jspdf-autotable").AutoTableUserOptions) => jsPDF;
  }
}
