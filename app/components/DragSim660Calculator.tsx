'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const gradientBg = 'radial-gradient(circle at top left, #ff6bd5 0%, #1b1b3a 35%, #02151f 100%)';

type BulbState = 'idle' | 'amber' | 'green' | 'red';

const bulbBaseStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: '1px solid #444',
  background: 'radial-gradient(circle at 30% 30%, #333 0%, #111 60%, #000 100%)',
  boxShadow: '0 0 4px rgba(0,0,0,0.9)',
  transition: 'box-shadow 0.15s ease, background 0.15s ease',
};

function bulbStyle(state: BulbState): CSSProperties {
  if (state === 'amber') {
    return {
      background: 'radial-gradient(circle at 30% 30%, #fff9c4 0%, #fdd835 40%, #ff8f00 100%)',
      boxShadow: '0 0 10px rgba(253,216,53,0.9)'
    };
  }
  if (state === 'green') {
    return {
      background: 'radial-gradient(circle at 30% 30%, #b9f6ca 0%, #00e676 40%, #00c853 100%)',
      boxShadow: '0 0 10px rgba(0,230,118,0.9)'
    };
  }
  if (state === 'red') {
    return {
      background: 'radial-gradient(circle at 30% 30%, #ffcdd2 0%, #ff1744 40%, #c62828 100%)',
      boxShadow: '0 0 10px rgba(255,23,68,0.9)'
    };
  }
  return {};
}

const containerStyle: CSSProperties = {
  fontFamily: 'Arial, sans-serif',
  background: gradientBg,
  color: '#f5f5f5',
  padding: '22px 24px',
  borderRadius: 18,
  maxWidth: 840,
  margin: '0 auto',
  boxShadow: '0 0 28px rgba(0,0,0,0.8)',
  border: '1px solid rgba(0,255,255,0.25)'
};

const labelStyle: CSSProperties = {
  display: 'block',
  marginTop: 6,
  marginBottom: 2,
  fontWeight: 700,
  fontSize: '0.9rem',
  color: '#ffb6ff'
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 999,
  border: '1px solid rgba(127,252,255,0.4)',
  background: 'rgba(3, 7, 15, 0.9)',
  color: '#eaffff',
  boxSizing: 'border-box',
  outline: 'none'
};

const buttonBase: CSSProperties = {
  padding: '10px 20px',
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.95rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  transition: 'transform 0.1s ease, box-shadow 0.1s ease, opacity 0.2s ease'
};

const startBtnStyle: CSSProperties = {
  ...buttonBase,
  background: 'linear-gradient(135deg, #ff9a4b, #ff3d9a)',
  color: '#080808',
  boxShadow: '0 0 12px rgba(255,154,75,0.8)'
};

const launchBtnStyle: CSSProperties = {
  ...buttonBase,
  background: 'linear-gradient(135deg, #7ffcff, #3ddcff)',
  color: '#021018',
  boxShadow: '0 0 12px rgba(127,252,255,0.8)'
};

type Results = {
  car: string;
  reaction: string;
  sixty: string;
  eighth: string;
  quarter: string;
};

function formatEt(et: number, mph: number) {
  return `${et.toFixed(3)} sec @ ${mph.toFixed(1)} MPH`;
}

function calcPass(hp: number, weight: number): Omit<Results, 'reaction' | 'car'> {
  const quarterET = 5.825 * Math.cbrt(weight / hp);
  const eighthET = quarterET * 0.66;
  const sixtyET = quarterET * 0.145;
  const quarterMPH = 234 * Math.cbrt(hp / weight);
  const eighthMPH = quarterMPH * 0.8;
  let sixtyMPH = quarterMPH * 0.35;
  if (sixtyMPH < 28) sixtyMPH = 28;
  if (sixtyMPH > 45) sixtyMPH = 45;
  return {
    sixty: formatEt(sixtyET, sixtyMPH),
    eighth: formatEt(eighthET, eighthMPH),
    quarter: formatEt(quarterET, quarterMPH)
  };
}

export default function DragSim660Calculator() {
  const t = useTranslations('dragSim');
  const [carName, setCarName] = useState('');
  const [horsepower, setHorsepower] = useState('');
  const [raceWeight, setRaceWeight] = useState('');
  const [treeStatus, setTreeStatus] = useState('');
  const [bulbs, setBulbs] = useState<{ amber1: BulbState; amber2: BulbState; amber3: BulbState; green: BulbState; red: BulbState}>(
    { amber1: 'idle', amber2: 'idle', amber3: 'idle', green: 'idle', red: 'idle' }
  );
  const [startDisabled, setStartDisabled] = useState(false);
  const [launchDisabled, setLaunchDisabled] = useState(true);
  const [results, setResults] = useState<Results | null>(null);
  const [treeRunning, setTreeRunning] = useState(false);
  const [greenTime, setGreenTime] = useState<number | null>(null);

  const timeoutsRef = useRef<number[]>([]);
  const treeRunningRef = useRef(treeRunning);
  useEffect(() => {
    treeRunningRef.current = treeRunning;
  }, [treeRunning]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  function resetBulbs() {
    setBulbs({ amber1: 'idle', amber2: 'idle', amber3: 'idle', green: 'idle', red: 'idle' });
  }

  function schedule(fn: () => void, delay: number) {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  }

  function validateInputs() {
    const hp = parseFloat(horsepower);
    const weight = parseFloat(raceWeight);
    if (!hp || !weight || hp <= 0 || weight <= 0) {
      alert('Please enter valid horsepower and race weight.');
      return null;
    }
    return { hp, weight };
  }

  function handleStartTree() {
    const numbers = validateInputs();
    if (!numbers) return;

    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];

    resetBulbs();
    setResults(null);
    setTreeStatus(t('preStaged'));
    setStartDisabled(true);
    setLaunchDisabled(false);
    setTreeRunning(true);
    setGreenTime(null);

    schedule(() => {
      if (!treeRunningRef.current) return;
      setTreeStatus(t('staged'));

      schedule(() => {
        if (!treeRunningRef.current) return;
        resetBulbs();
        setBulbs((prev) => ({ ...prev, amber1: 'amber' }));
        setTreeStatus(t('amber'));

        schedule(() => {
          if (!treeRunningRef.current) return;
          resetBulbs();
          setBulbs((prev) => ({ ...prev, amber2: 'amber' }));

          schedule(() => {
            if (!treeRunningRef.current) return;
            resetBulbs();
            setBulbs((prev) => ({ ...prev, amber3: 'amber' }));

            schedule(() => {
              if (!treeRunningRef.current) return;
              resetBulbs();
              setBulbs((prev) => ({ ...prev, green: 'green' }));
              setTreeStatus(t('greenHitLaunch'));
              setGreenTime(Date.now());
            }, 500);
          }, 500);
        }, 500);
      }, 500);
    }, 800);
  }

  function handleLaunch() {
    if (!treeRunningRef.current) return;

    const now = Date.now();
    let reaction: number;

    if (greenTime === null) {
      reaction = -0.1;
      setTreeStatus(t('redLight'));
      resetBulbs();
      setBulbs((prev) => ({ ...prev, red: 'red' }));
    } else {
      reaction = (now - greenTime) / 1000;
      setTreeStatus(t('passComplete'));
    }

    setTreeRunning(false);
    setLaunchDisabled(true);
    setStartDisabled(false);
    setGreenTime(null);

    const numbers = validateInputs();
    if (!numbers) return;

    const base = calcPass(numbers.hp, numbers.weight);
    const reactionText = reaction < 0 ? t('redLightTime') : `${reaction.toFixed(3)} sec`;
    setResults({
      car: carName.trim() || t('unnamedCombo'),
      reaction: reactionText,
      sixty: base.sixty,
      eighth: base.eighth,
      quarter: base.quarter,
    });
  }

  const responsiveContainer = useMemo(() => ({
    ...containerStyle,
    width: '100%'
  }), []);

  return (
    <div style={responsiveContainer}>
      <h1 style={{ textAlign: 'center', marginBottom: 6, fontSize: '1.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7ffcff', textShadow: '0 0 8px rgba(127,252,255,0.7)' }}>
        {t('title')}
      </h1>
      <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#d8d8ff', marginBottom: 18 }}>
        {t('subtitle')}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={labelStyle} htmlFor="hb-car-name">{t('carComboName')}</label>
          <input
            id="hb-car-name"
            style={inputStyle}
            type="text"
            placeholder={t('placeholderCarName')}
            value={carName}
            onChange={(e) => setCarName(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={labelStyle} htmlFor="hb-hp">{t('horsepowerHp')}</label>
          <input
            id="hb-hp"
            style={inputStyle}
            type="number"
            placeholder={t('placeholderHp')}
            value={horsepower}
            onChange={(e) => setHorsepower(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label style={labelStyle} htmlFor="hb-weight">{t('vehicleWeightLbs')}</label>
          <input
            id="hb-weight"
            style={inputStyle}
            type="number"
            placeholder={t('placeholderWeight')}
            value={raceWeight}
            onChange={(e) => setRaceWeight(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          style={{ ...startBtnStyle, opacity: startDisabled ? 0.45 : 1, cursor: startDisabled ? 'not-allowed' : 'pointer' }}
          onClick={handleStartTree}
          disabled={startDisabled}
        >
          {t('startTree')}
        </button>
        <button
          type="button"
          style={{ ...launchBtnStyle, opacity: launchDisabled ? 0.45 : 1, cursor: launchDisabled ? 'not-allowed' : 'pointer' }}
          onClick={handleLaunch}
          disabled={launchDisabled}
        >
          {t('launch')}
        </button>
      </div>

      <div style={{ marginTop: 18, padding: 12, background: 'rgba(3,7,15,0.9)', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(127,252,255,0.25)' }}>
        <div style={{ marginBottom: 10, fontSize: '0.95rem' }}>{treeStatus || t('pressStartTree')}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 4 }}>
          {(['amber1', 'amber2', 'amber3', 'green', 'red'] as const).map((key) => (
            <div key={key} style={{ ...bulbBaseStyle, ...bulbStyle(bulbs[key]) }} />
          ))}
        </div>
      </div>

      {results && (
        <div style={{ marginTop: 20, padding: 14, background: 'rgba(3,7,15,0.95)', borderRadius: 14, border: '1px solid rgba(255,154,255,0.3)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem', marginBottom: 8, color: '#ffb6ff' }}>{t('passResults')}</h2>
          {[[t('carCombo'), results.car], [t('reactionTime'), results.reaction], [t('sixtyFoot'), results.sixty], [t('eighthMile'), results.eighth], [t('quarterMile'), results.quarter]].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #222a', fontSize: '0.95rem' }}>
              <span>{label}:</span>
              <span>{value}</span>
            </div>
          ))}
          <div style={{ fontSize: '0.8rem', color: '#b0b0ff', marginTop: 8 }}>
            {t('disclaimer')}
          </div>
        </div>
      )}
    </div>
  );
}
