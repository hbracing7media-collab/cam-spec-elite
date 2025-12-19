'use client';

import dynamic from "next/dynamic";
import type { ConverterSlipCalculatorProps } from "./ConverterSlipCalculator";

const ConverterSlipCalculator = dynamic<ConverterSlipCalculatorProps>(() => import("./ConverterSlipCalculator"), {
  ssr: false,
  loading: () => (
    <div className="card" style={{ background: "rgba(2,6,23,0.55)", marginTop: 12 }}>
      <div className="card-inner">
        <div style={{ fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7dd3fc" }}>
          Loading Camshaft Suggestor Selective…
        </div>
        <p className="small" style={{ marginTop: 8, opacity: 0.9 }}>
          Fetching the client-side calculator bundle.
        </p>
      </div>
    </div>
  ),
});

export default function ConverterSlipCalculatorClient(props: ConverterSlipCalculatorProps) {
  return <ConverterSlipCalculator {...props} />;
}
