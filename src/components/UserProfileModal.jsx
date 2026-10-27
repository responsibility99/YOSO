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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl max-w-sm w-full border border-amber-200 text-stone-800 shadow-2xl flex flex-col max-h-[85vh]">
        {/* ヘッダー */}
        <div className="flex justify-between items-center border-b border-amber-100 pb-3 mb-4">
          <h3 className="font-black text-base text-amber-600">マイページ & 実績</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition"><X className="w-5 h-5"/></button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* ユーザーカード */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
            <div className="text-4xl bg-white p-2 rounded-2xl shadow-sm">{userProfile.avatar || '🎓'}</div>
            <div>
              <div className="font-extrabold text-base text-stone-800">{userProfile.name}</div>
              <div className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                <Medal className="w-3.5 h-3.5" /> Lv.{userProfile.level || 1} ({userProfile.xp || 0} XP)
              </div>
            </div>
          </div>

          {/* テストカウントダウン設定 */}
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
            <label className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" /> 次のテスト本番の日程
            </label>
            <input 
              type="date" 
              value={userProfile.testDate || ''} 
              onChange={e => setUserProfile({ ...userProfile, testDate: e.target.value })} 
              className="w-full bg-white border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-amber-400 shadow-sm" 
            />
            {daysLeft !== null && (
              <div className="text-center text-xs font-black text-rose-500 pt-1">
                {daysLeft > 0 ? `テストまであと ${daysLeft} 日！` : daysLeft === 0 ? '今日がテスト本番！' : 'テスト終了'}
              </div>
            )}
          </div>

          {/* プロフィール編集 */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-stone-500 mb-1 block">名前</label>
              <input 
                type="text" 
                value={userProfile.name} 
                onChange={e => setUserProfile({ ...userProfile, name: e.target.value })} 
                className="w-full bg-amber-50/40 border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-amber-400" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 mb-1 block">アイコン (絵文字)</label>
              <input 
                type="text" 
                value={userProfile.avatar} 
                onChange={e => setUserProfile({ ...userProfile, avatar: e.target.value })} 
                className="w-full bg-amber-50/40 border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-amber-400" 
              />
            </div>
          </div>

          {/* 実績バッジ */}
          <div className="space-y-2 pt-2 border-t border-amber-100">
            <h4 className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> 獲得バッジ
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(b => {
                const isEarned = (userProfile[b.type] || 0) >= b.req;
                return (
                  <div 
                    key={b.id} 
                    className={`p-2.5 rounded-2xl border flex items-center gap-2 transition ${
                      isEarned 
                        ? 'bg-amber-100/60 border-amber-300 text-stone-800 shadow-sm' 
                        : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                    }`}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <div>
                      <div className="text-[11px] font-black">{b.name}</div>
                      <div className="text-[9px] font-bold text-stone-500">{b.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-amber-100">
          <button onClick={onClose} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-2xl text-xs font-black shadow-md transition">
            保存して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
