'use client';

import { useEffect, useRef, useState } from 'react';

export default function RollRace60130Simulator() {
  const [carName, setCarName] = useState('');
  const [hp, setHp] = useState('');
  const [weight, setWeight] = useState('');

  const [treeRunning, setTreeRunning] = useState(false);
  const [greenTime, setGreenTime] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('Press “Start Tree” to stage.');
  const [canLaunch, setCanLaunch] = useState(false);

  const [amber1, setAmber1] = useState(false);
  const [amber2, setAmber2] = useState(false);
  const [amber3, setAmber3] = useState(false);
  const [green, setGreen] = useState(false);
  const [red, setRed] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [resCar, setResCar] = useState('');
  const [resRT, setResRT] = useState('');
  const [res60130, setRes60130] = useState('');
  const [res60130Total, setRes60130Total] = useState('');

  const timersRef = useRef<number[]>([]);

  function clearTimers() {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }

  function resetBulbs() {
    setAmber1(false);
    setAmber2(false);
    setAmber3(false);
    setGreen(false);
    setRed(false);
  }

  function parseInputs() {
    const hpNum = Number(hp);
    const wtNum = Number(weight);
    const ok = Number.isFinite(hpNum) && hpNum > 0 && Number.isFinite(wtNum) && wtNum > 0;
    return { ok, hpNum, wtNum };
  }

  function queue(fn: () => void, delay: number) {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
  }

  function startTree() {
    const { ok } = parseInputs();
    if (!ok) {
      alert('Please enter valid horsepower and race weight.');
      return;
    }

    clearTimers();
    resetBulbs();
    setShowResults(false);

    setGreenTime(null);
    setTreeRunning(true);
    setCanLaunch(true);
    setStatusText('Pre-staged…');

    queue(() => {
      setStatusText('Staged. Watch the tree…');

      queue(() => {
        resetBulbs();
        setAmber1(true);
        setStatusText('Amber…');

        queue(() => {
          resetBulbs();
          setAmber2(true);

          queue(() => {
            resetBulbs();
            setAmber3(true);

            queue(() => {
              resetBulbs();
              setGreen(true);
              setStatusText('GREEN! Hit LAUNCH!');
              setGreenTime(Date.now());
            }, 500);
          }, 500);
        }, 500);
      }, 800);
    }, 600);
  }

  function launch() {
    if (!treeRunning) return;

    const now = Date.now();
    let reaction = 0;

    if (greenTime === null) {
      setTreeRunning(false);
      resetBulbs();
      setRed(true);
      setStatusText('RED LIGHT! You left before green.');
      reaction = -0.1;
    } else {
      setTreeRunning(false);
      reaction = (now - greenTime) / 1000;
      setStatusText('Run complete. Check your times below.');
    }

    setCanLaunch(false);
    showResultsFor(reaction);
  }

  function showResultsFor(reactionTime: number) {
    const { ok, hpNum, wtNum } = parseInputs();
    if (!ok) return;

    const name = carName.trim() || 'Unnamed combo';

    let base60130 = 1.15 * (wtNum / hpNum);
    if (base60130 < 2.5) base60130 = 2.5;

    const total60130 = reactionTime < 0 ? base60130 : base60130 + reactionTime;

    setResCar(name);
    setResRT(reactionTime < 0 ? '-0.100 sec (RED)' : `${reactionTime.toFixed(3)} sec`);
    setRes60130(`${base60130.toFixed(2)} sec`);
    setRes60130Total(`${total60130.toFixed(2)} sec`);
    setShowResults(true);
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <div style={{ padding: 22 }}>
      <div id="hb60130-container">
        <h1 className="hb60130-title">HB Racing 60–130 MPH Simulator</h1>
        <div className="hb60130-subtitle">
          Enter HP and race weight, hit the tree, and see your reaction time and estimated 60–130 MPH time.
        </div>

        <div className="hb60130-row">
          <div>
            <label className="hb60130-label" htmlFor="hb60130-carName">
              Car / Combo Name (optional)
            </label>
            <input
              className="hb60130-input"
              id="hb60130-carName"
              type="text"
              placeholder="Hellwind, Sidewinder, etc."
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
            />
          </div>
        </div>

        <div className="hb60130-row">
          <div>
            <label className="hb60130-label" htmlFor="hb60130-hp">
              Horsepower (HP)
            </label>
            <input
              className="hb60130-input"
              id="hb60130-hp"
              type="number"
              placeholder="e.g. 800"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </div>
          <div>
            <label className="hb60130-label" htmlFor="hb60130-weight">
              Race Weight (lbs)
            </label>
            <input
              className="hb60130-input"
              id="hb60130-weight"
              type="number"
              placeholder="e.g. 3800"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        <div className="hb60130-button-row">
          <button
            id="hb60130-startBtn"
            className="hb60130-btn hb60130-btn-start"
            onClick={startTree}
            disabled={treeRunning}
          >
            Start Tree
          </button>

          <button
            id="hb60130-launchBtn"
            className="hb60130-btn hb60130-btn-launch"
            onClick={launch}
            disabled={!canLaunch}
          >
            LAUNCH!
          </button>
        </div>

        <div id="hb60130-treeArea" className="hb60130-tree-area">
          <div id="hb60130-treeStatus" className="hb60130-tree-status">
            {statusText}
          </div>

          <div className="hb60130-light-row">
            <div className={`hb60130-bulb${amber1 ? ' hb60130-on-yellow' : ''}`} />
            <div className={`hb60130-bulb${amber2 ? ' hb60130-on-yellow' : ''}`} />
            <div className={`hb60130-bulb${amber3 ? ' hb60130-on-yellow' : ''}`} />
            <div className={`hb60130-bulb${green ? ' hb60130-on-green' : ''}`} />
            <div className={`hb60130-bulb${red ? ' hb60130-on-red' : ''}`} />
          </div>
        </div>

        <div className="hb60130-results" style={{ display: showResults ? 'block' : 'none' }}>
          <h2 className="hb60130-results-title">Run Results</h2>

          <div className="hb60130-result-line">
            <span>Car / Combo:</span>
            <span>{resCar}</span>
          </div>

          <div className="hb60130-result-line">
            <span>Reaction Time (RT):</span>
            <span>{resRT}</span>
          </div>

          <div className="hb60130-result-line">
            <span>60–130 MPH Time (no RT):</span>
            <span>{res60130}</span>
          </div>

          <div className="hb60130-result-line">
            <span>60–130 MPH Time (with RT):</span>
            <span>{res60130Total}</span>
          </div>

          <div className="hb60130-note">
            60–130 MPH time is an estimate based on HP/weight only. Real-world aero, gearing, traction, and conditions will change actual results.
          </div>
        </div>
      </div>

      <style>{`
        #hb60130-container {
          font-family: Arial, sans-serif;
          background: radial-gradient(circle at top left, #ff6bd5 0%, #1b1b3a 35%, #02151f 100%);
          color: #f5f5f5;
          padding: 22px 24px;
          border-radius: 18px;
          max-width: 840px;
          margin: 0 auto;
          box-shadow: 0 0 28px rgba(0,0,0,0.8);
          border: 1px solid rgba(0,255,255,0.25);
        }
        .hb60130-title {
          text-align: center;
          margin-bottom: 6px;
          font-size: 1.8rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #7ffcff;
          text-shadow: 0 0 8px rgba(127,252,255,0.7);
        }
        .hb60130-subtitle {
          text-align: center;
          font-size: 0.95rem;
          color: #d8d8ff;
          margin-bottom: 18px;
        }
        .hb60130-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .hb60130-row > div {
          flex: 1 1 160px;
        }
        .hb60130-label {
          display: block;
          margin-top: 6px;
          margin-bottom: 2px;
          font-weight: bold;
          font-size: 0.9rem;
          color: #ffb6ff;
        }
        .hb60130-input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(127,252,255,0.4);
          background: rgba(3, 7, 15, 0.9);
          color: #eaffff;
          box-sizing: border-box;
          outline: none;
        }
        .hb60130-input:focus {
          border-color: #7ffcff;
          box-shadow: 0 0 10px rgba(127,252,255,0.5);
        }
        .hb60130-button-row {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .hb60130-btn {
          padding: 10px 20px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.2s ease;
        }
        .hb60130-btn-start {
          background: linear-gradient(135deg, #ff9a4b, #ff3d9a);
          color: #080808;
          box-shadow: 0 0 12px rgba(255,154,75,0.8);
        }
        .hb60130-btn-launch {
          background: linear-gradient(135deg, #7ffcff, #3ddcff);
          color: #021018;
          box-shadow: 0 0 12px rgba(127,252,255,0.8);
        }
        .hb60130-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 16px rgba(0,0,0,0.7);
        }
        .hb60130-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }
        .hb60130-tree-area {
          margin-top: 18px;
          padding: 12px;
          background: rgba(3,7,15,0.9);
          border-radius: 14px;
          text-align: center;
          border: 1px solid rgba(127,252,255,0.25);
        }
        .hb60130-tree-status {
          margin-bottom: 10px;
          font-size: 0.95rem;
        }
        .hb60130-light-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 4px;
        }
        .hb60130-bulb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid #444;
          background: radial-gradient(circle at 30% 30%, #333 0%, #111 60%, #000 100%);
          box-shadow: 0 0 4px rgba(0,0,0,0.9);
        }
        .hb60130-bulb.hb60130-on-yellow {
          background: radial-gradient(circle at 30% 30%, #fff9c4 0%, #fdd835 40%, #ff8f00 100%);
          box-shadow: 0 0 10px rgba(253,216,53,0.9);
        }
        .hb60130-bulb.hb60130-on-green {
          background: radial-gradient(circle at 30% 30%, #b9f6ca 0%, #00e676 40%, #00c853 100%);
          box-shadow: 0 0 10px rgba(0,230,118,0.9);
        }
        .hb60130-bulb.hb60130-on-red {
          background: radial-gradient(circle at 30% 30%, #ffcdd2 0%, #ff1744 40%, #c62828 100%);
          box-shadow: 0 0 10px rgba(255,23,68,0.9);
        }
        .hb60130-results {
          margin-top: 20px;
          padding: 14px;
          background: rgba(3,7,15,0.95);
          border-radius: 14px;
          border: 1px solid rgba(255,154,255,0.3);
        }
        .hb60130-results-title {
          margin-top: 0;
          font-size: 1.1rem;
          margin-bottom: 8px;
          color: #ffb6ff;
        }
        .hb60130-result-line {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #222a;
          font-size: 0.95rem;
        }
        .hb60130-result-line:last-child {
          border-bottom: none;
        }
        .hb60130-note {
          font-size: 0.8rem;
          color: #b0b0ff;
          margin-top: 8px;
        }
        @media (max-width: 600px) {
          #hb60130-container {
            padding: 18px 16px;
          }
          .hb60130-title {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
}
