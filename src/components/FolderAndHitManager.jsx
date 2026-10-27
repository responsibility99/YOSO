import React, { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { SUBJECT_ELEMENTS } from './BossBattle';

export default function FolderAndHitManager({ 
  folders, 
  questions, 
  selectedFolderId, 
  onSelectFolder, 
  onSelectQuestion, 
  userProfile, 
  gainXP 
}) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), { 
        name: newFolderName.trim(), 
        secretCode: userProfile.secretCode, 
        createdAt: serverTimestamp() 
      });
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (err) {
      alert('フォルダ作成に失敗しました');
    }
  };

  const handleToggleHit = async (e, q) => {
    e.stopPropagation();
    
    const hitBy = q.hitBy || [];
    const isAlreadyHit = hitBy.includes(userProfile.uid);
    const newHitBy = isAlreadyHit 
      ? hitBy.filter(id => id !== userProfile.uid) 
      : [...hitBy, userProfile.uid];

    try {
      await updateDoc(doc(db, 'questions', q.id), {
        hitCount: newHitBy.length,
        hitBy: newHitBy,
        lastHitAt: isAlreadyHit ? null : Date.now()
      });

      if (!isAlreadyHit) gainXP(15, 'hitCount');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuestions = selectedFolderId 
    ? questions.filter(q => q.folderId === selectedFolderId) 
    : questions;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button 
          onClick={() => onSelectFolder(null)} 
          className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition ${
            selectedFolderId === null 
              ? 'bg-amber-500 text-stone-900 shadow-md' 
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          すべて ({questions.length})
        </button>

        {folders.map(f => {
          const count = questions.filter(q => q.folderId === f.id).length;
          return (
            <button 
              key={f.id} 
              onClick={() => onSelectFolder(f.id)} 
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition ${
                selectedFolderId === f.id 
                  ? 'bg-amber-500 text-stone-900 shadow-md' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              📁 {f.name} ({count})
            </button>
          );
        })}

        <button 
          onClick={() => setShowFolderModal(true)} 
          className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 whitespace-nowrap"
        >
          <FolderPlus className="w-3.5 h-3.5" /> フォルダ追加
        </button>
      </div>

      <div className="space-y-2.5">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-bold text-xs bg-slate-800 rounded-3xl border border-slate-700">
            問題がありません。「カード作成」から新しい問題を投稿しよう！
          </div>
        ) : (
          filteredQuestions.map(q => {
            const elemInfo = SUBJECT_ELEMENTS[q.subject] || { name: '✨ 光属性', color: 'bg-amber-400 text-stone-900' };
            const isHitByMe = (q.hitBy || []).includes(userProfile.uid);
            const hitCount = q.hitCount || 0;

            return (
              <div 
                key={q.id} 
                onClick={() => onSelectQuestion(q.id)}
                className="bg-slate-800 hover:bg-slate-750 p-4 rounded-2xl border border-slate-700 cursor-pointer space-y-2 transition flex justify-between items-center group shadow-md"
              >
                <div className="space-y-1.5 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${elemInfo.color}`}>
                      {elemInfo.name} | {q.subject}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400">
                      by {q.author || '匿名'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-100 truncate">
                    Q. {q.subQuestions?.[0]?.question || '無題'}
                  </h4>
                </div>

                <button 
                  onClick={(e) => handleToggleHit(e, q)} 
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition transform active:scale-95 ${
                    isHitByMe 
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-slate-700/80 hover:bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                  title="テストに出たら押そう！"
                >
                  <span>🎯</span>
                  <span>{hitCount > 0 ? `${hitCount}的中` : '出た！'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h3 className="font-extrabold text-base text-amber-400">新規フォルダ作成</h3>
              <button type="button" onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
            </div>
            <input 
              type="text" 
              required 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="例: 中間テスト対策, 数学A" 
              className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-500 transition" 
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">キャンセル</button>
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-stone-900 px-5 py-2 rounded-xl text-xs font-black shadow-md">作成</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
