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
  const lowAce = [0, 1, 2, 3, 12]; // A2345 顺子
  if (JSON.stringify(values) === JSON.stringify(lowAce)) return [true, [3]]; // 返回A2345顺子的最大牌值（即5）
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] + 1 !== values[i + 1]) return [false, []];
  }
  return [true, values.slice().reverse()]; // 返回顺子的牌值，从大到小
}

function fiveCardRank(cards) {
  const counts = {};
  // 对牌面值进行排序，优先考虑葫芦优化，所以先不直接排序，而是按出现次数和牌值大小排序
  const values = cards.map(card => cardValue(card));
  for (const card of cards) counts[card[0]] = (counts[card[0]] || 0) + 1;

  // 根据牌的出现次数和牌值大小进行排序
  // 主要目的是为了更方便地找到三条和对子
  const vals = Object.entries(counts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // 先按数量降序
    return cardValue(b[0]) - cardValue(a[0]); // 数量相同则按牌值降序
  });

  const flush = isFlush(cards);
  const [straight, svals] = isStraight(cards);
  const sortedValuesDesc = values.sort((a, b) => b - a); // 牌值从大到小排序

  if (flush && straight) return [8, svals]; // 同花顺
  if (vals[0][1] === 4) return [7, [cardValue(vals[0][0])]]; // 四条
  
  if (vals[0][1] === 3 && vals[1][1] === 2) {
    // 葫芦优化：当存在三条和一对时，找到所有对子，选择最小的对子来构成葫芦
    const threeOfAKindRank = cardValue(vals[0][0]);
    const pairs = vals.filter(v => v[1] === 2).map(v => cardValue(v[0])).sort((a, b) => a - b); // 找到所有对子并升序排序
    
    // 如果有多个对子，选择最小的对子作为葫芦的对子部分
    if (pairs.length > 0) {
      return [6, [threeOfAKindRank, pairs[0]]]; // 葫芦，返回三条的牌值和最小对子的牌值
    } else {
      // 理论上这里不会发生，因为前面已经判断了 vals[1][1] === 2
      return [6, [threeOfAKindRank]]; 
    }
  }
  if (flush) return [5, sortedValuesDesc]; // 同花
  if (straight) return [4, svals]; // 顺子
  if (vals[0][1] === 3) return [3, [cardValue(vals[0][0])]]; // 三条
  if (vals.filter(v => v[1] === 2).length === 2)
    return [2, vals.filter(v => v[1] === 2).map(v => cardValue(v[0])).sort((a, b) => b - a)]; // 两对
  if (vals[0][1] === 2) return [1, [cardValue(vals[0][0])]]; // 一对
  return [0, sortedValuesDesc]; // 散牌
}

function threeCardRank(cards) {
  const counts = {};
  const values = cards.map(card => cardValue(card)).sort((a, b) => b - a);
  for (const card of cards) counts[card[0]] = (counts[card[0]] || 0) + 1;
  const vals = Object.entries(counts);
  if (vals.some(v => v[1] === 3)) return [2, values]; // 三条
  if (vals.some(v => v[1] === 2)) return [1, values]; // 一对
  return [0, values]; // 散牌
}

function isValidComb(top, mid, bot) {
  const t = threeCardRank(top);
  const m = fiveCardRank(mid);
  const b = fiveCardRank(bot);

  // 比较函数
  const compareRanks = (rankA, rankB, valuesA, valuesB) => {
    if (rankA !== rankB) return rankA - rankB; // 牌型不同直接比较牌型
    // 牌型相同，比较牌值。这里假设所有牌型返回的 values 都是可直接比较的（已排序）
    for (let i = 0; i < valuesA.length; i++) {
      if (valuesA[i] !== valuesB[i]) {
        return valuesA[i] - valuesB[i];
      }
    }
    return 0; // 牌型和牌值都相同
  };

  // 罗宋顺序：底道 > 中道 > 头道
  // 注意：在罗宋中，如果牌型相同，需要比较牌值。这里原始代码只比较了牌型等级
  // 修改为更严格的比较，确保下道牌型及牌值都大于等于上道
  const botVsMid = compareRanks(b[0], m[0], b[1], m[1]);
  const midVsTop = compareRanks(m[0], t[0], m[1], t[1]);

  return botVsMid >= 0 && midVsTop >= 0; // 符合罗宋顺序
}

function evaluate(cards) {
  let best = null;
  let bestScore = -1; // 用于存储最高分数，方便比较
  const n = cards.length;

  // 使用更高效的组合生成方式，避免多层循环
  // 生成所有可能的13张牌分发方式：3张头道，5张中道，5张底道
  const combinations = (arr, k) => {
    const result = [];
    const f = (prefix, arr) => {
      if (k === 0) {
        result.push(prefix);
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        f(prefix.concat(arr[i]), arr.slice(i + 1), k - 1);
      }
    };
    f([], arr, k);
    return result;
  };

  const allCards = cards;
  const topCombinations = combinations(allCards, 3);

  for (const top of topCombinations) {
    const remainingCardsAfterTop = allCards.filter(card => !top.includes(card));
    const midCombinations = combinations(remainingCardsAfterTop, 5);

    for (const mid of midCombinations) {
      const bot = remainingCardsAfterTop.filter(card => !mid.includes(card));

      if (isValidComb(top, mid, bot)) {
        const scoreBot = fiveCardRank(bot);
        const scoreMid = fiveCardRank(mid);
        const scoreTop = threeCardRank(top);

        // 计算一个总分数来比较组合的优劣
        // 权重可以根据罗宋的实际计分规则调整，这里简单地给予下道更高的权重
        // 例如：底道分数 * 100 + 中道分数 * 10 + 头道分数
        // 这里的 score 用数组表示各个道的牌型等级，可以逐级比较
        const currentScore = [scoreBot[0], scoreMid[0], scoreTop[0]];
        
        // 进一步细化分数比较：如果牌型等级相同，比较牌值
        const compareScores = (s1, s2) => {
          if (s1[0] !== s2[0]) return s1[0] - s2[0]; // 比较底道牌型
          if (s1[1] !== s2[1]) return s1[1] - s2[1]; // 比较中道牌型
          if (s1[2] !== s2[2]) return s1[2] - s2[2]; // 比较头道牌型
          
          // 如果牌型等级完全相同，则比较牌值（这里需要更复杂的逻辑，因为每种牌型返回的values结构不同）
          // 简单起见，目前只比较牌型等级，若需精确比较，可展开对 scoreBot[1], scoreMid[1], scoreTop[1] 的比较
          return 0;
        };

        if (!best || compareScores(currentScore, bestScore) > 0) {
          bestScore = currentScore;
          best = { top, mid, bot };
        }
      }
    }
  }
  return best; // 返回最佳组合
}

function formatCard(card) {
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  const suitSymbols = { H: '♥', D: '♦', S: '♠', C: '♣' };
  const isRed = suit === 'H' || suit === 'D';

  return (
    <span
      key={card}
      style={{
        color: isRed ? 'red' : 'black',
        marginRight: '8px',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}
    >
      {suitSymbols[suit]}{rank}
    </span>
  );
}

export default function ThirteenCardAnalyzer() {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    const cards = `${input1} ${input2}`.trim().toUpperCase().split(/\s+/);
    if (cards.length !== 13) {
      alert('请输入13张牌');
      return;
    }
    const r = evaluate(cards);
    setResult(r);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>罗宋分析器</h1>

      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '1rem' }}>请输入13张牌（可分两行）：</p>
        <input
          type="text"
          value={input1}
          onChange={e => setInput1(e.target.value)}
          style={{ width: '300px', padding: '8px', marginBottom: '0.5rem', fontSize: '1rem' }}
        />
        <br />
        <input
          type="text"
          value={input2}
          onChange={e => setInput2(e.target.value)}
          style={{ width: '300px', padding: '8px', fontSize: '1rem' }}
        />
      </div>

      <button
        onClick={handleAnalyze}
        style={{
          padding: '10px 20px',
          fontSize: '1.1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '2rem'
        }}
      >
        分析最优组合
      </button>

      {result && (
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '1.1rem' }}>
          <div><strong>头道:</strong> {result.top.map(card => formatCard(card))}</div>
          <div><strong>中道:</strong> {result.mid.map(card => formatCard(card))}</div>
          <div><strong>底道:</strong> {result.bot.map(card => formatCard(card))}</div>
        </div>
      )}

      <div
        style={{
          marginTop: '2rem',
          textAlign: 'center',
          maxWidth: '400px',
          marginInline: 'auto',
          fontSize: '0.9rem'
        }}
      >
        <h3><strong>使用说明：</strong></h3>
        <p>红桃：H（如 AH 表示红桃A）</p>
        <p>黑桃：S（如 KS 表示黑桃K）</p>
        <p>方块：D（如 QD 表示方块Q）</p>
        <p>梅花：C（如 7C 表示梅花7）</p>
        <p>10 用 T 表示，如 10H 应写作 TH</p>
      </div>
    </div>
  );
}
