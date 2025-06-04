import React, { useState } from 'react';

const RANKS = '23456789TJQKA';

function cardValue(card) {
  return RANKS.indexOf(card[0]);
}

function isFlush(cards) {
  return new Set(cards.map(c => c[1])).size === 1;
}

function isStraight(cards) {
  const values = cards.map(card => cardValue(card)).sort((a, b) => a - b);
  const lowAce = [0, 1, 2, 3, 12];
  if (JSON.stringify(values) === JSON.stringify(lowAce)) return [true, [3]];
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] + 1 !== values[i + 1]) return [false, []];
  }
  return [true, values.slice().reverse()];
}

function fiveCardRank(cards) {
  const counts = {};
  const values = cards.map(card => cardValue(card)).sort((a, b) => b - a);
  for (const card of cards) counts[card[0]] = (counts[card[0]] || 0) + 1;
  const vals = Object.entries(counts).sort((a, b) => b[1] - a[1] || cardValue(b[0]) - cardValue(a[0]));
  const flush = isFlush(cards);
  const [straight, svals] = isStraight(cards);

  if (flush && straight) return [8, svals];
  if (vals[0][1] === 4) return [7, [cardValue(vals[0][0])]];
  if (vals[0][1] === 3 && vals[1][1] === 2) return [6, [cardValue(vals[0][0])]];
  if (flush) return [5, values];
  if (straight) return [4, svals];
  if (vals[0][1] === 3) return [3, [cardValue(vals[0][0])]];
  if (vals.filter(v => v[1] === 2).length === 2)
    return [2, vals.filter(v => v[1] === 2).map(v => cardValue(v[0])).sort((a, b) => b - a)];
  if (vals[0][1] === 2) return [1, [cardValue(vals[0][0])]];
  return [0, values];
}

function threeCardRank(cards) {
  const counts = {};
  const values = cards.map(card => cardValue(card)).sort((a, b) => b - a);
  for (const card of cards) counts[card[0]] = (counts[card[0]] || 0) + 1;
  const vals = Object.entries(counts);
  if (vals.some(v => v[1] === 3)) return [2, values];
  if (vals.some(v => v[1] === 2)) return [1, values];
  return [0, values];
}

function isValidComb(top, mid, bot) {
  const t = threeCardRank(top);
  const m = fiveCardRank(mid);
  const b = fiveCardRank(bot);
  return b[0] > m[0] && m[0] >= t[0];
}

function evaluate(cards) {
  let best = null;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        const top = [cards[i], cards[j], cards[k]];
        const rest1 = cards.filter((_, idx) => idx !== i && idx !== j && idx !== k);
        for (let a = 0; a < rest1.length; a++) {
          for (let b = a + 1; b < rest1.length; b++) {
            for (let c = b + 1; c < rest1.length; c++) {
              for (let d = c + 1; d < rest1.length; d++) {
                for (let e = d + 1; e < rest1.length; e++) {
                  const mid = [rest1[a], rest1[b], rest1[c], rest1[d], rest1[e]];
                  const bot = rest1.filter((_, idx) => ![a, b, c, d, e].includes(idx));
                  if (isValidComb(top, mid, bot)) {
                    const score = [fiveCardRank(bot), fiveCardRank(mid), threeCardRank(top)];
                    if (!best || score > best[0]) best = [score, { top, mid, bot }];
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return best ? best[1] : null;
}

export default function ThirteenCardAnalyzer() {
  const [input1, setInput1] = useState('AH AD AC KH KS');
  const [input2, setInput2] = useState('QD QH QS JC JD 9S 8H 7D');
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    const cards = (input1 + ' ' + input2).trim().split(/\s+/);
    if (cards.length !== 13) {
      alert('请输入13张牌');
      return;
    }
    const r = evaluate(cards);
    setResult(r);
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>罗宋分析器</h1>
      <div style={{ marginBottom: '0.5rem' }}>请输入13张牌（可分两行）：</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <input
          value={input1}
          onChange={e => setInput1(e.target.value)}
          style={{ width: '21ch', padding: '0.5rem', fontSize: '1rem', textAlign: 'center' }}
        />
        <input
          value={input2}
          onChange={e => setInput2(e.target.value)}
          style={{ width: '21ch', padding: '0.5rem', fontSize: '1rem', textAlign: 'center' }}
        />
      </div>

      <button
        onClick={handleAnalyze}
        style={{
          marginTop: '1.5rem',
          fontSize: '1.2rem',
          padding: '0.6rem 1.2rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        分析最优组合
      </button>

      {result && (
        <div style={{ marginTop: '2rem', fontSize: '1.1rem' }}>
          <div><strong>头道：</strong>{result.top.join(' ')}</div>
          <div><strong>中道：</strong>{result.mid.join(' ')}</div>
          <div><strong>底道：</strong>{result.bot.join(' ')}</div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '400px', marginInline: 'auto', fontSize: '0.8rem' }}>
        <h3>使用说明：</h3>
        <p>红桃：H（如 AH 表示红桃A）</p>
        <p>黑桃：S（如 KS 表示黑桃K）</p>
        <p>方块：D（如 QD 表示方块Q）</p>
        <p>梅花：C（如 7C 表示梅花7）</p>
        <p>10 用 T 表示，如 10H 应写作 TH</p>
      </div>
    </div>
  );
}

