import React, { useState, useEffect } from 'react';
import { Swords, Zap, Check, X, Clock } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';

export default function PvPBattle({ leaderboard, currentUid, questions, userProfile, gainXP }) {
  const [battleState, setBattleState] = useState(null); // Firestoreの対戦状態
  const [battleId, setBattleId] = useState(null);
  const [waitingTarget, setWaitingTarget] = useState(null);

  // リアルタイム対戦データの監視
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

  // 対戦を申し込む
  const handleInvite = async (targetUser) => {
    const newBattleId = `battle_${Date.now()}`;
    setWaitingTarget(targetUser);

    // 自分の対戦状態
    await setDoc(doc(db, 'pvp_battles', userProfile.uid), {
      battleId: newBattleId,
      status: 'waiting',
      role: 'host',
      opponentUid: targetUser.uid,
      opponentName: targetUser.name,
      myHp: 1000,
      opponentHp: 1000,
    });

    // 相手への対戦リクエスト通知
    await setDoc(doc(db, 'pvp_battles', targetUser.uid), {
      battleId: newBattleId,
      status: 'invited',
      role: 'guest',
      opponentUid: userProfile.uid,
      opponentName: userProfile.name,
      myHp: 1000,
      opponentHp: 1000,
    });

    setBattleId(newBattleId);
  };

  // 対戦リクエストを受ける
  const handleAccept = async () => {
    if (!battleState) return;
    
    await updateDoc(doc(db, 'pvp_battles', userProfile.uid), { status: 'playing' });
    await updateDoc(doc(db, 'pvp_battles', battleState.opponentUid), { status: 'playing' });
  };

  // 対戦リクエストを拒否・キャンセル
  const handleCancel = async () => {
    if (battleState?.opponentUid) {
      await setDoc(doc(db, 'pvp_battles', battleState.opponentUid), {});
    }
    await setDoc(doc(db, 'pvp_battles', userProfile.uid), {});
    setWaitingTarget(null);
  };

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
            <button onClick={handleAccept} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1">
              <Check className="w-4 h-4"/> 受ける
            </button>
            <button onClick={handleCancel} className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1">
              <X className="w-4 h-4"/> 断る
            </button>
          </div>
        </div>
      )}

      {/* 相手の応答待ち画面 */}
      {battleState?.status === 'waiting' && (
        <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
          <Clock className="w-8 h-8 text-amber-500 mx-auto animate-spin" />
          <div className="font-black text-sm text-stone-800">
            <span className="text-amber-600">{waitingTarget?.name}</span> の応答を待っています…
          </div>
          <button onClick={handleCancel} className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold">
            キャンセル
          </button>
        </div>
      )}

      {/* 通常の対戦相手一覧 */}
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
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition transform active:scale-95"
                >
                  対戦を申し込む ⚔️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* プレイ中（対戦画面） */}
      {battleState?.status === 'playing' && (
        <div className="space-y-4 py-2">
          <div className="bg-amber-100/60 p-4 rounded-2xl text-center space-y-2">
            <div className="font-black text-xs text-stone-700">VS {battleState.opponentName}</div>
            <div className="text-sm font-black text-amber-700">正解して相手のHPを削ろう！</div>
          </div>
          <button onClick={handleCancel} className="w-full bg-rose-500 text-white py-2.5 rounded-xl font-black text-xs">
            対戦を終了する
          </button>
        </div>
      )}
    </div>
  );
}
