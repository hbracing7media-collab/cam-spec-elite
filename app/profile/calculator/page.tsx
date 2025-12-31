'use client';

import MyCalculator from "@/app/components/MyCalculator";

export default function ProfileCalculatorPage() {
  return (
    <div className="card">
      <div className="card-inner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ margin: 0 }}>My Calculator</h1>
          <a className="pill" href="/profile">Back to Profile</a>
        </div>
        <p className="small" style={{ marginTop: 10 }}>
          Your personal cam and engine combo estimator with dyno curve.
        </p>

        <hr className="hr" />
        <MyCalculator />
      </div>
    </div>
  );
}
