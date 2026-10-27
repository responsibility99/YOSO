import React, { useState } from 'react';
import { Swords, Zap, Flame, Shield, Heart } from 'lucide-react';

// 教科ごとの属性定義
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

// 初期ボスデータ
export const INITIAL_BOSSES = [
  { id: 'b1', name: '期末テストの魔王 (開成級)', maxHp: 15000, currentHp: 15000, atk: 120, icon: '👹', desc: '全員の総力で問題を解いてHPを削り切れ！' },
  { id: 'b2', name: '東大二次模試の幻獣', maxHp: 30000, currentHp: 30000, atk: 250, icon: '🐉', desc: '難解な予想問題カードでクリティカルを狙え！' }
];

export default function BossBattle({ bossData, questions, onSelectQuestion }) {
  const hpPercent = Math.max(0, Math.min(100, (bossData.currentHp / bossData.maxHp) * 100));

  return (
    <div className="space-y-6">
      {/* 討伐バナー */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 rounded-3xl shadow-2xl border border-purple-500/30 relative overflow-hidden space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">{bossData.icon}</span>
            <div>
              <h3 className="font-black text-lg text-purple-300">{bossData.name}</h3>
              <p className="text-xs text-slate-400 font-bold">{bossData.desc}</p>
            </div>
          </div>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-black">
            開成級BOSS
          </span>
        </div>

        {/* ゲージ */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-extrabold text-slate-300">
            <span>ボスHP</span>
            <span className="text-rose-400 font-black">{bossData.currentHp.toLocaleString()} / {bossData.maxHp.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 p-0.5 border border-slate-700 shadow-inner">
            <div 
              className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 攻撃につかうカード選択 */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-400" /> ボス攻撃用スキルカード（予想問題）
        </h3>
        
        {questions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-bold text-xs bg-slate-800 rounded-3xl border border-slate-700">
            使えるカードがありません。「カード作成」から予想問題を投稿しよう！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questions.map(q => {
              const elemInfo = SUBJECT_ELEMENTS[q.subject] || { name: '✨ 光属性', color: 'bg-amber-400 text-stone-900' };
              return (
                <div 
                  key={q.id} 
                  onClick={() => onSelectQuestion(q.id)}
                  className="bg-slate-800 hover:bg-slate-750 p-4 rounded-2xl border border-slate-700 cursor-pointer space-y-2 transition transform active:scale-98 shadow-md"
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${elemInfo.color}`}>
                      {elemInfo.name} | {q.subject}
                    </span>
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> ATK {q.atk || 200}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-100 truncate">
                    Q. {q.subQuestions?.[0]?.question || '無題'}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-bold flex justify-between">
                    <span>作成者: {q.author || '匿名'}</span>
                    <span className="text-amber-400">タップして正解し攻撃 ⚔️</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
