"use client";

import React from "react";

interface ShortBlock {
  id: string;
  block_name: string;
  engine_make?: string;
  engine_family?: string;
  bore?: string;
  stroke?: string;
  rod_length?: string;
  cyl?: number;
  deck_height?: string;
  piston_dome_dish?: string;
  head_gasket_bore?: string;
  head_gasket_compressed_thickness?: string;
  attachedHead?: {
    id: string;
    head_name: string;
    intake_ports?: number;
    exhaust_ports?: number;
    chamber_volume?: number;
    chamber_cc?: number;
    flow_data?: any;
  } | null;
  attachedCams?: any[];
}

interface Props {
  shortBlocks?: ShortBlock[];
}

export default function ProfileCalculator({ shortBlocks = [] }: Props) {
  return (
    <div style={{ border: "2px solid #7dd3fc", borderRadius: 12, padding: 24, background: "rgba(2,6,23,0.85)", color: "#e2e8f0", marginBottom: 32 }}>
      <h2 style={{ color: "#7dd3fc", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Profile Calculator (Isolated)</h2>
      {/* Calculator UI will go here */}
      <div style={{ color: "#94a3b8", fontSize: 13 }}>
        This is a new, profile-only calculator widget. UI and logic will be added next.
      </div>
    </div>
  );
}
