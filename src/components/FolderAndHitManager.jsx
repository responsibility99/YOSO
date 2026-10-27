import React, { useState } from 'react';
import { FolderPlus, ArrowUpDown, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

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
  const [sortMode, setSortMode] = useState('newest');

  // 新規フォルダ作成処理
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

  // 神的中（🎯出た！）ボタン処理
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

  // フィルタリング ＆ ソート
  let filteredQuestions = selectedFolderId 
    ? questions.filter(q => q.folderId === selectedFolderId) 
    : [...questions];

  if (sortMode === 'newest') {
    filteredQuestions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else if (sortMode === 'hits') {
    filteredQuestions.sort((a, b) => (b.hitCount || 0) - (a.hitCount || 0));
  }

  return (
    <div className="space-y-4">
      {/* フォルダ選択 ＆ ソート */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button 
            onClick={() => onSelectFolder(null)} 
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition ${
              selectedFolderId === null 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'bg-white text-stone-600 border border-amber-200 hover:bg-amber-50'
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
                    ? 'bg-amber-500 text-white shadow-sm' 
                    : 'bg-white text-stone-600 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                📁 {f.name} ({count})
              </button>
            );
          })}

          <button 
            onClick={() => setShowFolderModal(true)} 
            className="bg-white hover:bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 whitespace-nowrap shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" /> フォルダ作成
          </button>
        </div>

        <button 
          onClick={() => setSortMode(sortMode === 'newest' ? 'hits' : 'newest')}
          className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 whitespace-nowrap shadow-sm shrink-0"
        >
          <ArrowUpDown className="w-3 h-3"/> {sortMode === 'newest' ? '新着順' : '的中順'}
        </button>
      </div>

      {/* 問題一覧（スマホで問題文が2行表示されるよう改善） */}
      <div className="space-y-2.5">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-stone-400 font-bold text-xs bg-white rounded-3xl border border-amber-200">
            問題がありません。「問題作成」から新しい問題を投稿しよう！
          </div>
        ) : (
          filteredQuestions.map(q => {
            const isHitByMe = (q.hitBy || []).includes(userProfile.uid);
            const hitCount = q.hitCount || 0;
            const subCount = (q.subQuestions || []).length;

            return (
              <div 
                key={q.id} 
                onClick={() => onSelectQuestion(q.id)}
                className="bg-white hover:bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 cursor-pointer transition flex items-start justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {q.subject}
                    </span>
                    {subCount > 1 && (
                      <span className="bg-orange-100 text-orange-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                        {subCount}問構成
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold text-stone-400">
                      by {q.author || '匿名'}
                    </span>
                  </div>
                  
                  {/* タイトル（2行までしっかり表示） */}
                  <h4 className="font-extrabold text-xs text-stone-800 leading-snug line-clamp-2 break-words">
                    Q. {q.subQuestions?.[0]?.question || '無題'}
                  </h4>
                </div>

                <button 
                  onClick={(e) => handleToggleHit(e, q)} 
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition shrink-0 transform active:scale-95 ${
                    isHitByMe 
                      ? 'bg-rose-500 text-white shadow-md' 
                      : 'bg-amber-50 hover:bg-amber-100 text-stone-700 border border-amber-200'
                  }`}
                  title="テストに出たら押そう！"
                >
                  <span>🎯</span>
                  <span>{hitCount > 0 ? `${hitCount}` : '出た！'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* フォルダ作成モーダル */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-white p-6 rounded-3xl max-w-sm w-full space-y-4 border border-amber-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-100 pb-2">
              <h3 className="font-extrabold text-base text-amber-600">新規フォルダ作成</h3>
              <button type="button" onClick={() => setShowFolderModal(false)} className="text-stone-400 hover:text-stone-700"><X className="w-4 h-4"/></button>
            </div>
            <input 
              type="text" 
              required 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="例: 期末テスト対策, 数学B" 
              className="w-full bg-amber-50/50 border border-amber-200 p-3 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-amber-500" 
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-xs font-bold text-stone-500">キャンセル</button>
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md">作成</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
