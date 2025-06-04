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
  const [input, setInput] = useState('AH AD AC KH KS QD QH QS JC JD 9S 8H 7D');
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    const cards = input.trim().split(/\s+/);
    if (cards.length !== 13) {
      alert('请输入13张牌');
      return;
    }
    const r = evaluate(cards);
    setResult(r);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">十三张牌力分析器</h2>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        className="p-2 border rounded mb-4 text-lg"
        placeholder="输入13张牌，如 AH AD AC KH ..."
        style={{ width: '100%', fontSize: '1.25rem', overflowX: 'auto' }}
      />
      <button onClick={handleAnalyze} className="bg-blue-500 text-white px-4 py-2 rounded">分析最优组合</button>
      {result && (
        <div className="mt-4 text-lg">
          <div><strong>上墩:</strong> {result.top.join(' ')}</div>
          <div><strong>中墩:</strong> {result.mid.join(' ')}</div>
          <div><strong>下墩:</strong> {result.bot.join(' ')}</div>
        </div>
      )}
    </div>
  );
}
