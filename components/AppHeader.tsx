"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <div className="header">
      <div className="header-row">
        <div className="brand">
          {/* Public image = Home button */}
          <Link className="brand-badge" href="/" aria-label="Home">
            <img src="/miami-bg.jpg" alt="HB Racing 7 Home" />
          </Link>

          <div>
            <div className="brand-title">HB Racing 7</div>
            <div className="small">Dark Miami Neon System</div>
          </div>
        </div>

        <div className="nav">
          <Link className="pill" href="/">Home</Link>
          <Link className="pill" href="/forum">Forum</Link>
          <Link className="pill" href="/calculators">Calculators</Link>
          <Link className="pill" href="/cams">Cams</Link>
          <Link className="pill" href="/cylinder-heads">Heads</Link>
          <Link className="pill" href="/shop">Shop</Link>
          <Link className="pill" href="/profile">Profile</Link>
        </div>
      </div>
    </div>
  );
}
