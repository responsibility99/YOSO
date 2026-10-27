import React, { useState, useEffect } from 'react';
import { Swords, Check, X, Clock, Zap, Trophy, Filter, ShoppingBag, Shield, Wrench, Sparkles } from 'lucide-react';
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

// ショップアイテム定義（武器・防具）
const SHOP_ITEMS = [
  { id: 'w1', name: '木の剣', type: 'weapon', cost: 100, atkBonus: 20, icon: '🗡️' },
  { id: 'w2', name: '鋼の太刀', type: 'weapon', cost: 300, atkBonus: 60, icon: '⚔️' },
  { id: 'w3', name: '聖なる杖', type: 'weapon', cost: 600, atkBonus: 120, icon: '🪄' },
  { id: 'a1', name: '皮の服', type: 'armor', cost: 100, defBonus: 10, icon: '🛡️' },
  { id: 'a2', name: '鉄のプレート armor', type: 'armor', cost: 300, defBonus: 30, icon: '🪖' },
  { id: 'a3', name: '光の盾', type: 'armor', cost: 600, defBonus: 60, icon: '🔰' },
];

export default function PvPBattle({ leaderboard, currentUid, questions, userProfile, folders = [], gainXP, setUserProfile }) {
  const [battleState, setBattleState] = useState(null);
  const [waitingTarget, setWaitingTarget] = useState(null);
  const [showShop, setShowShop] = useState(false);

  // 出題範囲設定
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // バトル内ステート
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [lastDamageText, setLastDamageText] = useState('');

  // レベルに基づく基礎ステータス計算
  const level = userProfile.level || 1;
  const maxHp = 1000 + (level * 100); // レベルごとに最大HP +100
  const baseAtk = level * 10;          // レベルごとに基礎攻撃力 +10

  // 装備による補正値
  const equippedWeapon = SHOP_ITEMS.find(i => i.id === userProfile.weaponId);
  const equippedArmor = SHOP_ITEMS.find(i => i.id === userProfile.armorId);
  const totalAtk = baseAtk + (equippedWeapon?.atkBonus || 0);
  const totalDef = equippedArmor?.defBonus || 0;

  useEffect(() => {
    if (!userProfile.uid) return;
    const unsub = onSnapshot(doc(db, 'pvp_battles', userProfile.uid), (snapshot) => {
      if (snapshot.exists()) {
        setBattleState(snapshot.data());
      } else {
        setBattleState(null);
      }
    });
    return () => unsub();
  }, [userProfile.uid]);

  const activeQuestions = questions.filter(q => {
    const matchFolder = !battleState?.targetFolderId || battleState.targetFolderId === 'all' || q.folderId === battleState.targetFolderId;
    const matchSubject = !battleState?.targetSubject || battleState.targetSubject === 'all' || q.subject === battleState.targetSubject;
    return matchFolder && matchSubject;
  });

  useEffect(() => {
    if (battleState?.status !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          nextQuestion();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [battleState?.status, currentQIndex, activeQuestions.length]);

  // ショップ購入処理
  const handleBuyItem = (item) => {
    if ((userProfile.xp || 0) < item.cost) {
      alert('XPが足りません！問題作成やチャットでXPを溜めよう。');
      return;
    }

    const key = item.type === 'weapon' ? 'weaponId' : 'armorId';
    setUserProfile(prev => ({
      ...prev,
      xp: prev.xp - item.cost,
      [key]: item.id
    }));
    alert(`「${item.name}」を購入し、装備しました！`);
  };

  const handleInvite = async (targetUser) => {
    const newBattleId = `battle_${Date.now()}`;
    setWaitingTarget(targetUser);

    const folderObj = folders.find(f => f.id === selectedFolderId);
    const rangeName = `${folderObj ? '📁 ' + folderObj.name : '全フォルダ'} / ${selectedSubject !== 'all' ? '📚 ' + selectedSubject : '全教科'}`;

    // 相手の防御補正を取り入れた対戦初期データ
    const initBattleData = {
      battleId: newBattleId,
      status: 'waiting',
      hostUid: userProfile.uid,
      hostName: userProfile.name,
      hostHp: maxHp,
      hostMaxHp: maxHp,
      hostAtk: totalAtk,
      hostDef: totalDef,
      guestUid: targetUser.uid,
      guestName: targetUser.name,
      guestHp: 1000 + ((targetUser.level || 1) * 100),
      guestMaxHp: 1000 + ((targetUser.level || 1) * 100),
      targetFolderId: selectedFolderId,
      targetSubject: selectedSubject,
      rangeName: rangeName
    };

    await setDoc(doc(db, 'pvp_battles', userProfile.uid), { ...initBattleData, role: 'host', opponentUid: targetUser.uid, opponentName: targetUser.name });
    await setDoc(doc(db, 'pvp_battles', targetUser.uid), { ...initBattleData, status: 'invited', role: 'guest', opponentUid: userProfile.uid, opponentName: userProfile.name });
  };

  const handleAccept = async () => {
    if (!battleState) return;
    await updateDoc(doc(db, 'pvp_battles', userProfile.uid), { status: 'playing' });
    await updateDoc(doc(db, 'pvp_battles', battleState.opponentUid), { status: 'playing' });
  };

  const handleCancel = async () => {
    if (battleState?.opponentUid) {
      await setDoc(doc(db, 'pvp_battles', battleState.opponentUid), {});
    }
    await setDoc(doc(db, 'pvp_battles', userProfile.uid), {});
    setWaitingTarget(null);
  };

  const nextQuestion = () => {
    setInputAnswer('');
    setTimeLeft(10);
    const total = activeQuestions.length || 1;
    setCurrentQIndex(prev => (prev + 1) % total);
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (activeQuestions.length === 0) return;

    const activeQ = activeQuestions[currentQIndex % activeQuestions.length];
    const correctAnswer = activeQ?.subQuestions?.[0]?.answer || '';

    if (inputAnswer.trim() === correctAnswer.trim()) {
      const speedBonus = timeLeft * 20;
      // 攻撃力 ＆ 防御力計算
      const rawDamage = 150 + totalAtk + speedBonus;
      const isHost = battleState.role === 'host';
      const opponentDef = isHost ? (battleState.guestDef || 0) : (battleState.hostDef || 0);
      const finalDamage = Math.max(30, rawDamage - opponentDef); // 最低でも30ダメージ

      setLastDamageText(`⚡ クリティカル！ ${finalDamage} ダメージ！（攻撃+${totalAtk}）`);

      const targetHpKey = isHost ? 'guestHp' : 'hostHp';
      const currentOpponentHp = isHost ? (battleState.guestHp ?? 1000) : (battleState.hostHp ?? 1000);
      const newOpponentHp = Math.max(0, currentOpponentHp - finalDamage);

      const updateObj = { [targetHpKey]: newOpponentHp };

      if (newOpponentHp <= 0) {
        updateObj.status = 'finished';
        updateObj.winner = userProfile.name;
        gainXP(150, null);
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

  const currentQ = activeQuestions[currentQIndex % (activeQuestions.length || 1)];
  const myHp = battleState?.role === 'host' ? battleState?.hostHp : battleState?.guestHp;
  const myMaxHp = battleState?.role === 'host' ? battleState?.hostMaxHp : battleState?.guestMaxHp;
  const opponentHp = battleState?.role === 'host' ? battleState?.guestHp : battleState?.hostHp;
  const opponentMaxHp = battleState?.role === 'host' ? battleState?.guestMaxHp : battleState?.hostMaxHp;

  return (
    <div className="bg-white p-5 rounded-3xl border border-amber-200 space-y-4 shadow-md">
      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-amber-500" />
          <h3 className="font-black text-base text-stone-800">1対1 リアルタイム対戦</h3>
        </div>
        <button 
          onClick={() => setShowShop(!showShop)} 
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
          {showShop ? '対戦に戻る' : '装備ショップ (XP)'}
        </button>
      </div>

      {/* 装備ショップモーダル風表示 */}
      {showShop ? (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 flex justify-between items-center text-xs font-black">
            <span>所持XP: <span className="text-amber-600">{userProfile.xp || 0} XP</span></span>
            <span>Lv.{level} ステータス: HP+{level*100} / ATK+{baseAtk}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {SHOP_ITEMS.map(item => {
              const isEquipped = (item.type === 'weapon' && userProfile.weaponId === item.id) || (item.type === 'armor' && userProfile.armorId === item.id);
              return (
                <div key={item.id} className="bg-white p-3 rounded-2xl border border-amber-200 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-xs font-black text-stone-800">{item.name}</div>
                      <div className="text-[10px] text-stone-500 font-bold">
                        {item.atkBonus ? `攻撃+${item.atkBonus}` : `防御+${item.defBonus}`}
                      </div>
                    </div>
                  </div>
                  {isEquipped ? (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-lg">装備中</span>
                  ) : (
                    <button 
                      onClick={() => handleBuyItem(item)} 
                      className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm"
                    >
                      {item.cost} XP
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* ロビー画面 */}
          {(!battleState || !battleState.status) && (
            <div className="space-y-4">
              {/* ステータスバー */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-3 rounded-2xl border border-amber-200 flex justify-around text-center text-xs font-black">
                <div>
                  <div className="text-[10px] text-stone-500">最大HP</div>
                  <div className="text-emerald-600">{maxHp}</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500">攻撃力</div>
                  <div className="text-amber-600">{totalAtk} {equippedWeapon ? `(${equippedWeapon.icon})` : ''}</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500">防御力</div>
                  <div className="text-indigo-600">{totalDef} {equippedArmor ? `(${equippedArmor.icon})` : ''}</div>
                </div>
              </div>

              {/* 出題範囲選択 */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-800">
                  <Filter className="w-4 h-4 text-amber-500" /> 出題範囲を設定
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={selectedFolderId} 
                    onChange={e => setSelectedFolderId(e.target.value)} 
                    className="bg-white border border-amber-200 p-2 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-amber-400 shadow-sm"
                  >
                    <option value="all">すべてのフォルダ</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>📁 {f.name}</option>
                    ))}
                  </select>

                  <select 
                    value={selectedSubject} 
                    onChange={e => setSelectedSubject(e.target.value)} 
                    className="bg-white border border-amber-200 p-2 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-amber-400 shadow-sm"
                  >
                    <option value="all">すべての教科</option>
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>📚 {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <div className="text-[11px] font-extrabold text-stone-500 px-1">対戦相手を選択:</div>
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
                        申し込む ⚔️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 招待確認 */}
          {battleState?.status === 'invited' && (
            <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-center space-y-3 animate-bounce">
              <div className="font-black text-sm text-stone-800">
                ⚔️ <span className="text-amber-600">{battleState.opponentName}</span> から対戦申し込みが届きました！
              </div>
              <div className="text-[11px] font-bold text-stone-600 bg-white/80 py-1.5 px-3 rounded-xl inline-block border border-amber-200">
                出題範囲: {battleState.rangeName || 'すべて'}
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

          {/* 待機中 */}
          {battleState?.status === 'waiting' && (
            <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
              <Clock className="w-8 h-8 text-amber-500 mx-auto animate-spin" />
              <div className="font-black text-sm text-stone-800">
                <span className="text-amber-600">{waitingTarget?.name}</span> の応答を待っています…
              </div>
              <div className="text-[11px] font-bold text-stone-500">
                出題範囲: {battleState.rangeName}
              </div>
              <button onClick={handleCancel} className="bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold">
                キャンセル
              </button>
            </div>
          )}

          {/* プレイ中 */}
          {battleState?.status === 'playing' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-black text-stone-700">
                    <span>{userProfile.name}</span>
                    <span>{myHp ?? maxHp} / {myMaxHp ?? maxHp} HP</span>
                  </div>
                  <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, ((myHp ?? maxHp) / (myMaxHp ?? maxHp)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-black text-stone-700">
                    <span>{battleState.opponentName}</span>
                    <span>{opponentHp ?? 1000} / {opponentMaxHp ?? 1000} HP</span>
                  </div>
                  <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, ((opponentHp ?? 1000) / (opponentMaxHp ?? 1000)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {lastDamageText && (
                <div className="text-center font-black text-xs text-amber-600 animate-bounce">
                  {lastDamageText}
                </div>
              )}

              {activeQuestions.length > 0 && currentQ ? (
                <div className="bg-white border-2 border-amber-300 p-4 rounded-2xl space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black">{currentQ.subject}</span>
                    <span className="text-rose-500 font-black flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> 残り {timeLeft}秒</span>
                  </div>

                  <div className="font-extrabold text-sm text-stone-800 py-2">
                    Q. {currentQ.subQuestions?.[0]?.question || '無題'}
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
                <div className="text-center py-8 text-stone-400 font-bold text-xs bg-amber-50/50 rounded-2xl border border-amber-200">
                  選択された出題範囲に当てはまる問題がありません
                </div>
              )}

              <button onClick={handleCancel} className="w-full bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-600 py-2 rounded-xl font-bold text-xs border border-stone-200 transition">
                対戦を降参・終了する
              </button>
            </div>
          )}

          {/* 終了判定 */}
          {battleState?.status === 'finished' && (
            <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-2xl text-center space-y-3 shadow-lg">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
              <h4 className="font-black text-lg text-stone-800">勝者: {battleState.winner}！</h4>
              <p className="text-xs font-bold text-stone-600">お疲れ様でした！勝利者に150 XPが与えられます。</p>
              <button onClick={handleCancel} className="bg-amber-500 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md">
                対戦画面を閉じる
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
