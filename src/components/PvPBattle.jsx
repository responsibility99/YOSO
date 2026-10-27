import React, { useState, useEffect } from 'react';
import { Swords, Check, X, Clock, Zap, Trophy, ShieldAlert } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';

export const SUBJECT_ELEMENTS = {
  '国語1': { name: '国語1', color: 'bg-amber-100 text-amber-800' },
  '国語２a': { name: '国語２a', color: 'bg-amber-100 text-amber-800' },
  '国語２ｂ': { name: '国語２ｂ', color: 'bg-amber-100 text-amber-800' },
  '歴史': { name: '歴史', color: 'bg-amber-100 text-amber-800' },
  '数学Ａ': { name: '数学Ａ', color: 'bg-amber-100 text-amber-800' },
  '数学Ｂ': { name: '数学Ｂ', color: 'bg-amber-100 text-amber-800' },
  '化学': { name: '化学', color: 'bg-amber-100 text-amber-800' },
  '生物': { name: '生物', color: 'bg-amber-100 text-amber-800' },
  '地学': { name: '地学', color: 'bg-amber-100 text-amber-800' },
  '地理': { name: '地理', color: 'bg-amber-100 text-amber-800' },
  '英語１': { name: '英語１', color: 'bg-amber-100 text-amber-800' },
  '英語２': { name: '英語２', color: 'bg-amber-100 text-amber-800' },
  '音楽': { name: '音楽', color: 'bg-amber-100 text-amber-800' }
};

export const SUBJECTS = Object.keys(SUBJECT_ELEMENTS);

export default function PvPBattle({ leaderboard, currentUid, questions, userProfile, gainXP }) {
  const [battleState, setBattleState] = useState(null);
  const [waitingTarget, setWaitingTarget] = useState(null);

  // ゲーム内ステート
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(10); // 1問あたりの制限時間（秒）
  const [lastDamageText, setLastDamageText] = useState('');

  // リアルタイム対戦監視
  useEffect(() => {
    if (!userProfile.uid) return;
    const unsub = onSnapshot(doc(db, 'pvp_battles', userProfile.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBattleState(data);
      } else {
        setBattleState(null);
      }
    });
    return () => unsub();
  }, [userProfile.uid]);

  // バトル中のタイマー処理
  useEffect(() => {
    if (battleState?.status !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // タイムオーバーで次の問題へ
          nextQuestion();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState?.status, currentQIndex]);

  // 対戦を申し込む
  const handleInvite = async (targetUser) => {
    const newBattleId = `battle_${Date.now()}`;
    setWaitingTarget(targetUser);

    const initBattleData = {
      battleId: newBattleId,
      status: 'waiting',
      hostUid: userProfile.uid,
      hostName: userProfile.name,
      hostHp: 1000,
      guestUid: targetUser.uid,
      guestName: targetUser.name,
      guestHp: 1000,
    };

    await setDoc(doc(db, 'pvp_battles', userProfile.uid), { ...initBattleData, role: 'host', opponentUid: targetUser.uid, opponentName: targetUser.name });
    await setDoc(doc(db, 'pvp_battles', targetUser.uid), { ...initBattleData, status: 'invited', role: 'guest', opponentUid: userProfile.uid, opponentName: userProfile.name });
  };

  // 申し込みを受ける
  const handleAccept = async () => {
    if (!battleState) return;
    await updateDoc(doc(db, 'pvp_battles', userProfile.uid), { status: 'playing' });
    await updateDoc(doc(db, 'pvp_battles', battleState.opponentUid), { status: 'playing' });
  };

  // キャンセル・終了
  const handleCancel = async () => {
    if (battleState?.opponentUid) {
      await setDoc(doc(db, 'pvp_battles', battleState.opponentUid), {});
    }
    await setDoc(doc(db, 'pvp_battles', userProfile.uid), {});
    setWaitingTarget(null);
  };

  // 次の問題へスキップ
  const nextQuestion = () => {
    setInputAnswer('');
    setTimeLeft(10);
    setCurrentQIndex(prev => (prev + 1) % (questions.length || 1));
  };

  // 回答チェック & 攻撃ロジック
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!questions || questions.length === 0) return;

    const activeQ = questions[currentQIndex % questions.length];
    const correctAnswer = activeQ?.subQuestions?.[0]?.answer || '';

    if (inputAnswer.trim() === correctAnswer.trim()) {
      // 素早さボーナスダメージ計算（早く答えるほど大ダメージ）
      const speedBonus = timeLeft * 25;
      const totalDamage = 150 + speedBonus;

      setLastDamageText(`⚡ FAST! ${totalDamage} ダメージを与えた！`);

      // 相手のHPを減らす
      const isHost = battleState.role === 'host';
      const targetHpKey = isHost ? 'guestHp' : 'hostHp';
      const currentOpponentHp = isHost ? (battleState.guestHp ?? 1000) : (battleState.hostHp ?? 1000);
      const newOpponentHp = Math.max(0, currentOpponentHp - totalDamage);

      const updateObj = { [targetHpKey]: newOpponentHp };

      if (newOpponentHp <= 0) {
        updateObj.status = 'finished';
        updateObj.winner = userProfile.name;
        gainXP(100, null); // 勝利報酬
      }

      await updateDoc(doc(db, 'pvp_battles', userProfile.uid), updateObj);
      await updateDoc(doc(db, 'pvp_battles', battleState.opponentUid), updateObj);

      setTimeout(() => setLastDamageText(''), 2000);
    } else {
      setLastDamageText('❌ 不正解！');
      setTimeout(() => setLastDamageText(''), 1500);
    }

    nextQuestion();
  };

  const currentQ = questions?.[currentQIndex % (questions?.length || 1)];
  const myHp = battleState?.role === 'host' ? battleState?.hostHp : battleState?.guestHp;
  const opponentHp = battleState?.role === 'host' ? battleState?.guestHp : battleState?.hostHp;

  return (
    <div className="bg-white p-5 rounded-3xl border border-amber-200 space-y-4 shadow-md">
      <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
        <Swords className="w-5 h-5 text-amber-500" />
        <h3 className="font-black text-base text-stone-800">1対1 リアルタイム対戦</h3>
      </div>

      {/* リクエスト受信画面 */}
      {battleState?.status === 'invited' && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-center space-y-3 animate-bounce">
          <div className="font-black text-sm text-stone-800">
            ⚔️ <span className="text-amber-600">{battleState.opponentName}</span> から対戦申し込みが届きました！
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={handleAccept} className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1">
              <Check className="w-4 h-4"/> 受ける
            </button>
            <button onClick={handleCancel} className="bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1">
              <X className="w-4 h-4"/> 断る
            </button>
          </div>
        </div>
      )}

      {/* 応答待ち画面 */}
      {battleState?.status === 'waiting' && (
        <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
          <Clock className="w-8 h-8 text-amber-500 mx-auto animate-spin" />
          <div className="font-black text-sm text-stone-800">
            <span className="text-amber-600">{waitingTarget?.name}</span> の応答を待っています…
          </div>
          <button onClick={handleCancel} className="bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold">
            キャンセル
          </button>
        </div>
      )}

      {/* 通常時のロビー（相手選択） */}
      {(!battleState || !battleState.status) && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {leaderboard.filter(u => u.uid !== currentUid).length === 0 ? (
            <div className="text-center py-6 text-stone-400 font-bold text-xs">他に部屋に参加しているメンバーがいません</div>
          ) : (
            leaderboard.filter(u => u.uid !== currentUid).map(u => (
              <div key={u.uid} className="bg-amber-50/50 p-3 rounded-2xl flex items-center justify-between border border-amber-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{u.avatar || '🎓'}</span>
                  <div>
                    <div className="text-xs font-black text-stone-800">{u.name}</div>
                    <div className="text-[10px] font-bold text-amber-600">Lv.{u.level || 1} • {u.xp || 0} XP</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleInvite(u)} 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition transform active:scale-95"
                >
                  対戦を申し込む ⚔️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 一問一答 スピードバトル対戦画面 */}
      {battleState?.status === 'playing' && (
        <div className="space-y-4 py-2">
          {/* お互いのHPゲージバー */}
          <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-200">
            {/* 自分 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-black text-stone-700">
                <span>{userProfile.name} (あなた)</span>
                <span>{myHp ?? 1000} HP</span>
              </div>
              <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, (myHp ?? 1000) / 10)}%` }}></div>
              </div>
            </div>

            {/* 相手 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-black text-stone-700">
                <span>{battleState.opponentName}</span>
                <span>{opponentHp ?? 1000} HP</span>
              </div>
              <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, (opponentHp ?? 1000) / 10)}%` }}></div>
              </div>
            </div>
          </div>

          {/* ダメージ・通知メッセージ */}
          {lastDamageText && (
            <div className="text-center font-black text-xs text-amber-600 animate-bounce">
              {lastDamageText}
            </div>
          )}

          {/* 問題回答エリア */}
          {currentQ ? (
            <div className="bg-white border-2 border-amber-300 p-4 rounded-2xl space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black">{currentQ.subject}</span>
                <span className="text-rose-500 font-black flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> 残り {timeLeft}秒</span>
              </div>

              <div className="font-extrabold text-sm text-stone-800 py-2">
                Q. {currentQ.subQuestions?.[0]?.question || '問題文が読み込めません'}
              </div>

              <form onSubmit={handleAnswerSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  required 
                  value={inputAnswer} 
                  onChange={e => setInputAnswer(e.target.value)} 
                  placeholder="答えを入力して送信..." 
                  className="flex-1 bg-amber-50/50 border border-amber-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-amber-500" 
                />
                <button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center gap-1">
                  <Zap className="w-4 h-4"/> 攻撃！
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6 text-stone-400 font-bold text-xs">登録されている問題がありません</div>
          )}

          <button onClick={handleCancel} className="w-full bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-600 py-2 rounded-xl font-bold text-xs border border-stone-200 transition">
            対戦を降参・終了する
          </button>
        </div>
      )}

      {/* 勝敗決着画面 */}
      {battleState?.status === 'finished' && (
        <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-2xl text-center space-y-3 shadow-lg">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
          <h4 className="font-black text-lg text-stone-800">勝者: {battleState.winner}！</h4>
          <p className="text-xs font-bold text-stone-600">お疲れ様でした！勝利者に100 XPが与えられます。</p>
          <button onClick={handleCancel} className="bg-amber-500 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md">
            対戦画面を閉じる
          </button>
        </div>
      )}
    </div>
  );
}
