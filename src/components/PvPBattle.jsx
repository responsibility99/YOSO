import React, { useState } from 'react';
import { Swords, Zap, Shield, Trophy, UserCheck, Flame } from 'lucide-react';

// 教科・属性データ
export const SUBJECT_ELEMENTS = {
  '国語1': { element: 'fire', name: '🔥 火属性', color: 'bg-rose-500 text-white' },
  '国語２a': { element: 'fire', name: '🔥 火属性', color: 'bg-rose-500 text-white' },
  '国語２ｂ': { element: 'fire', name: '🔥 火属性', color: 'bg-rose-500 text-white' },
  '歴史': { element: 'fire', name: '🔥 火属性', color: 'bg-rose-500 text-white' },
  '数学Ａ': { element: 'water', name: '💧 水属性', color: 'bg-blue-500 text-white' },
  '数学Ｂ': { element: 'water', name: '💧 水属性', color: 'bg-blue-500 text-white' },
  '化学': { element: 'water', name: '💧 水属性', color: 'bg-blue-500 text-white' },
  '生物': { element: 'water', name: '💧 水属性', color: 'bg-blue-500 text-white' },
  '地学': { element: 'water', name: '💧 水属性', color: 'bg-blue-500 text-white' },
  '地理': { element: 'wind', name: '🍃 風属性', color: 'bg-emerald-500 text-white' },
  '英語１': { element: 'wind', name: '🍃 風属性', color: 'bg-emerald-500 text-white' },
  '英語２': { element: 'wind', name: '🍃 風属性', color: 'bg-emerald-500 text-white' },
  '音楽': { element: 'light', name: '✨ 光属性', color: 'bg-amber-400 text-stone-900' }
};

export const SUBJECTS = Object.keys(SUBJECT_ELEMENTS);

export default function PvPBattle({ leaderboard, currentUid, questions, userProfile, gainXP }) {
  const [opponent, setOpponent] = useState(null);
  const [myHp, setMyHp] = useState(1000);
  const [opponentHp, setOpponentHp] = useState(1000);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [battleLog, setBattleLog] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  // 対戦相手を選択してバトル開始
  const handleStartBattle = (targetUser) => {
    setOpponent(targetUser);
    setMyHp(1000);
    setOpponentHp(1000);
    setIsFinished(false);
    setBattleLog(`${targetUser.name} との対戦が開始された！`);
    pickNextQuestion();
  };

  // ランダム問題の抽出
  const pickNextQuestion = () => {
    if (questions.length === 0) return;
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    setActiveQuestion(randomQ);
    setShowAnswer(false);
  };

  // 回答＆攻撃処理
  const handleAttack = (isCorrect) => {
    setShowAnswer(true);
    if (!activeQuestion) return;

    const atk = activeQuestion.atk || 200;
    if (isCorrect) {
      const isCrit = Math.random() > 0.6;
      const dmg = isCrit ? Math.floor(atk * 1.5) : atk;
      const nextHp = Math.max(0, opponentHp - dmg);
      setOpponentHp(nextHp);
      setBattleLog(isCrit ? `⚡ 会心の一撃！ ${opponent.name} に ${dmg} ダメージ！` : `⚔️ 正解！ ${opponent.name} に ${dmg} ダメージ！`);

      if (nextHp === 0) {
        setIsFinished(true);
        gainXP(100, null);
      }
    } else {
      // 不正解の場合は反撃を受ける
      const counterDmg = 150;
      const nextMyHp = Math.max(0, myHp - counterDmg);
      setMyHp(nextMyHp);
      setBattleLog(`❌ 不正解... ${opponent.name} から ${counterDmg} の反撃を受けた！`);

      if (nextMyHp === 0) {
        setIsFinished(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      {!opponent ? (
        /* 対戦相手の選択画面 */
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <Swords className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-base text-slate-100">1対1 対人バトル (PvP)</h3>
          </div>
          <p className="text-xs font-bold text-slate-400">対戦したい相手を選んでバトルを申し込もう！</p>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {leaderboard.filter(u => u.uid !== currentUid).length === 0 ? (
              <div className="text-center py-6 text-slate-500 font-bold text-xs">他に部屋に参加しているメンバーがいません</div>
            ) : (
              leaderboard.filter(u => u.uid !== currentUid).map(u => (
                <div key={u.uid} className="bg-slate-700/50 p-3 rounded-2xl flex items-center justify-between border border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{u.avatar || '⚔️'}</span>
                    <div>
                      <div className="text-xs font-black text-white">{u.name}</div>
                      <div className="text-[10px] font-bold text-amber-400">Lv.{u.level || 1} • {u.xp || 0} XP</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartBattle(u)} 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-900 px-4 py-2 rounded-xl text-xs font-black shadow-md transition transform active:scale-95"
                  >
                    対戦を申し込む ⚔️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* バトル対戦画面 */
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-5 shadow-2xl animate-fade-in">
          {/* 対戦ヘッダー（双方のHPバー） */}
          <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-700">
            {/* 自分 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span className="text-amber-400 truncate">{userProfile.avatar} {userProfile.name}</span>
                <span className="text-rose-400">{myHp} / 1000</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(myHp / 1000) * 100}%` }} />
              </div>
            </div>

            {/* 相手 */}
            <div className="space-y-1 text-right">
              <div className="flex justify-between text-xs font-black">
                <span className="text-rose-400">{opponentHp} / 1000</span>
                <span className="text-indigo-400 truncate">{opponent.name} {opponent.avatar}</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div className="bg-rose-500 h-full transition-all duration-300 ml-auto" style={{ width: `${(opponentHp / 1000) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* 実況ログ */}
          {battleLog && (
            <div className="text-center text-xs font-black text-amber-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
              {battleLog}
            </div>
          )}

          {/* 対戦結果判定 */}
          {isFinished ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-2xl font-black text-amber-400">
                {myHp > 0 ? '🎉 VICTORIA! 勝利！ (+100 XP)' : '💀 DEFEAT... 敗北...'}
              </div>
              <button 
                onClick={() => setOpponent(null)} 
                className="bg-amber-500 text-stone-900 px-6 py-3 rounded-2xl font-black text-xs shadow-lg"
              >
                対戦相手選択へ戻る
              </button>
            </div>
          ) : (
            /* クイズ問題カード */
            activeQuestion && (
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="bg-amber-400 text-stone-900 px-2.5 py-0.5 rounded-full">{activeQuestion.subject}</span>
                  <span className="text-amber-400">威力: ATK {activeQuestion.atk || 200}</span>
                </div>

                <div className="text-sm font-black text-white leading-relaxed">
                  Q. {activeQuestion.subQuestions?.[0]?.question || '問題文なし'}
                </div>

                {showAnswer ? (
                  <div className="space-y-3">
                    <div className="bg-slate-800 p-3 rounded-xl text-xs font-bold text-rose-300 border border-slate-700">
                      正解: {activeQuestion.subQuestions?.[0]?.answer || '解答なし'}
                    </div>
                    <button 
                      onClick={pickNextQuestion} 
                      className="w-full bg-amber-500 text-stone-900 py-3 rounded-xl text-xs font-black"
                    >
                      次の問題へ ⚔️
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button 
                      onClick={() => handleAttack(true)} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs shadow-md"
                    >
                      ⭕ 解答できた（攻撃）
                    </button>
                    <button 
                      onClick={() => handleAttack(false)} 
                      className="bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-black text-xs shadow-md"
                    >
                      ❌ わからない（ミス）
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          <div className="flex justify-end">
            <button onClick={() => setOpponent(null)} className="text-[11px] font-bold text-slate-400 underline">対戦を中断する</button>
          </div>
        </div>
      )}
    </div>
  );
}
