import ConverterSlipCalculator from "@/app/components/ConverterSlipCalculatorClient";

export const metadata = {
  title: "Cam Suggestor Global | HB Racing 7",
  description: "Cam suggestion based on calculations, cross referenced with available cams from web data",
};

export default function CamSuggestorGlobalPage() {
  return (
    <div className="card">
      <div className="card-inner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ margin: 0 }}>Cam Suggestor Global</h1>
          <a className="pill" href="/calculators">All Calculators</a>
        </div>
        <p className="small" style={{ marginTop: 10 }}>
          Cam suggestion based on calculations, cross referenced with available cams from web data
        </p>

        <hr className="hr" />
        <ConverterSlipCalculator mode="global" desiredSuggestions={3} />
      </div>
    </div>
  );
}
