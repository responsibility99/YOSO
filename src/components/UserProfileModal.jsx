import React, { useState } from 'react';
import { X, Camera, Award } from 'lucide-react';

const AVATARS = ['🎓', '✏️', '🦊', '🐱', '🐶', '🐼', '🦁', '🚀', '⭐', '🔥'];

export default function UserProfileModal({ userProfile, setUserProfile, badges, onClose }) {
  const [name, setName] = useState(userProfile.name || '');
  const [avatar, setAvatar] = useState(userProfile.avatar || '🎓');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(userProfile.customAvatarUrl || '');
  const [testDate, setTestDate] = useState(userProfile.testDate || '');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('ファイルサイズが大きすぎます (2MB以下の画像を選択してください)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setUserProfile(prev => ({
      ...prev,
      name: name.trim() || 'チャレンジャー',
      avatar,
      customAvatarUrl,
      testDate
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-3xl max-w-sm w-full border border-amber-200 text-stone-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-amber-100 pb-3">
          <h3 className="font-black text-base text-stone-800">プロフィール編集</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="text-center space-y-2">
            <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-md">
              {customAvatarUrl ? (
                <img src={customAvatarUrl} alt="custom avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{avatar}</span>
              )}
            </div>

            <div className="flex justify-center gap-2">
              <label className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl cursor-pointer shadow-sm flex items-center gap-1">
                <Camera className="w-3.5 h-3.5"/> 写真を選択
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {customAvatarUrl && (
                <button 
                  type="button" 
                  onClick={() => setCustomAvatarUrl('')} 
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold px-2 py-1.5 rounded-xl"
                >
                  写真を解除
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {AVATARS.map(a => (
                <button 
                  key={a} 
                  type="button" 
                  onClick={() => { setAvatar(a); setCustomAvatarUrl(''); }} 
                  className={`text-lg p-1.5 rounded-xl border transition ${avatar === a && !customAvatarUrl ? 'bg-amber-200 border-amber-400' : 'bg-white border-stone-200'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-stone-700">名前</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-amber-50/50 border border-amber-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-stone-700">目標テスト本番日</label>
            <input 
              type="date" 
              value={testDate} 
              onChange={e => setTestDate(e.target.value)} 
              className="w-full bg-amber-50/50 border border-amber-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-amber-400 text-stone-800"
            />
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-black text-xs shadow-md">
            保存する
          </button>
        </form>

        <div className="border-t border-amber-100 pt-3 space-y-2">
          <h4 className="text-xs font-black text-stone-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500"/> 獲得バッジ
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {badges.map(b => {
              const isUnlocked = (userProfile[b.type] || 0) >= b.req;
              return (
                <div key={b.id} className={`p-2 rounded-xl border flex items-center gap-2 text-xs ${isUnlocked ? 'bg-amber-50 border-amber-300' : 'bg-stone-50 border-stone-200 opacity-50'}`}>
                  <span className="text-lg">{b.icon}</span>
                  <div>
                    <div className="font-black text-[11px] text-stone-800">{b.name}</div>
                    <div className="text-[9px] text-stone-500 font-bold">{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
