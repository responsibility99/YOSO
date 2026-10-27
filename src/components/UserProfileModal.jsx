import React from 'react';
import { Medal, Calendar, ShieldCheck, X } from 'lucide-react';

export default function UserProfileModal({ 
  userProfile, 
  setUserProfile, 
  badges, 
  onClose 
}) {
  const getDaysUntilTest = () => {
    if (!userProfile.testDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = new Date(userProfile.testDate) - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilTest();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 rounded-3xl max-w-sm w-full border border-slate-700 text-slate-200 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
          <h3 className="font-extrabold text-lg text-amber-400">プレイヤー情報 & 実績</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
            <div className="text-4xl">{userProfile.avatar || '⚔️'}</div>
            <div>
              <div className="font-extrabold text-base text-white">{userProfile.name}</div>
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                <Medal className="w-3.5 h-3.5" /> Lv.{userProfile.level || 1} ({userProfile.xp || 0} XP)
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> 次のテスト日程
            </label>
            <input 
              type="date" 
              value={userProfile.testDate || ''} 
              onChange={e => setUserProfile({ ...userProfile, testDate: e.target.value })} 
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs font-bold text-white outline-none" 
            />
            {daysLeft !== null && (
              <div className="text-center text-xs font-black text-rose-400 pt-1">
                {daysLeft > 0 ? `テストまであと ${daysLeft} 日！` : daysLeft === 0 ? '今日がテスト本番！' : 'テスト終了'}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block">プレイヤー名</label>
              <input 
                type="text" 
                value={userProfile.name} 
                onChange={e => setUserProfile({ ...userProfile, name: e.target.value })} 
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs outline-none font-bold text-white" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block">アイコン (絵文字)</label>
              <input 
                type="text" 
                value={userProfile.avatar} 
                onChange={e => setUserProfile({ ...userProfile, avatar: e.target.value })} 
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs outline-none font-bold text-white" 
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-700">
            <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> 獲得バッジ
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(b => {
                const isEarned = (userProfile[b.type] || 0) >= b.req;
                return (
                  <div 
                    key={b.id} 
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      isEarned 
                        ? 'bg-amber-500/10 border-amber-500/30 text-slate-100' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-600 opacity-60'
                    }`}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <div>
                      <div className="text-[11px] font-black">{b.name}</div>
                      <div className="text-[9px] font-bold text-slate-400">{b.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700">
          <button onClick={onClose} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 py-3 rounded-xl text-xs font-black shadow-lg">
            保存して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
