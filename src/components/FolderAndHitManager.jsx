import React, { useState } from 'react';
import { FolderPlus, Flame, Star, Trash2, Edit } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function FolderAndHitManager({
  folders,
  questions,
  selectedFolderId,
  onSelectFolder,
  onSelectQuestion,
  userProfile,
  setUserProfile,
  gainXP,
  onToggleFavorite,
  onEditQuestion
}) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), {
        name: newFolderName.trim(),
        secretCode: userProfile.secretCode,
        createdBy: userProfile.uid,
        createdAt: Date.now()
      });
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (err) {
      alert('フォルダ作成失敗');
    }
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (window.confirm('このフォルダを削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'folders', folderId));
        if (selectedFolderId === folderId) onSelectFolder(null);
      } catch (err) {
        alert('削除失敗');
      }
    }
  };

  // 「出た！」ボタンの連打防止付きカウントアップ
  const handleHitClick = async (qId, currentHits = 0, e) => {
    e.stopPropagation();

    const hitQIds = userProfile.hitQIds || [];
    if (hitQIds.includes(qId)) {
      alert('「出た！」は1つの問題につき1度しか押せません！');
      return;
    }

    try {
      await updateDoc(doc(db, 'questions', qId), {
        hitCount: (currentHits || 0) + 1
      });
      
      // ローカルの押した履歴を更新して連打をブロック
      setUserProfile(prev => ({
        ...prev,
        hitQIds: [...(prev.hitQIds || []), qId]
      }));

      gainXP(10, 'hitCount');
    } catch (err) {
      console.error(err);
    }
  };

  // 問題削除（作成者のみ）
  const handleDeleteQuestion = async (qId, e) => {
    e.stopPropagation();
    if (window.confirm('この問題を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'questions', qId));
      } catch (err) {
        alert('問題削除失敗');
      }
    }
  };

  const displayedQuestions = selectedFolderId
    ? questions.filter(q => q.folderId === selectedFolderId)
    : questions;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-stone-600">フォルダ選択</span>
          <button 
            onClick={() => setShowCreateFolder(!showCreateFolder)} 
            className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition"
          >
            <FolderPlus className="w-3.5 h-3.5"/> 新規フォルダ
          </button>
        </div>

        {showCreateFolder && (
          <form onSubmit={handleCreateFolder} className="flex gap-2 bg-white p-2.5 rounded-2xl border border-amber-200">
            <input 
              type="text" 
              required 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="例: 期末テスト予想" 
              className="flex-1 bg-amber-50/50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold outline-none"
            />
            <button type="submit" className="bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-black">
              追加
            </button>
          </form>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button 
            onClick={() => onSelectFolder(null)} 
            className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition ${
              selectedFolderId === null ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-stone-700 border-amber-200'
            }`}
          >
            すべて ({questions.length})
          </button>
          {folders.map(f => {
            const isSelected = selectedFolderId === f.id;
            const canDelete = f.createdBy === userProfile.uid;
            return (
              <div 
                key={f.id} 
                onClick={() => onSelectFolder(f.id)} 
                className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border flex items-center gap-1.5 cursor-pointer transition ${
                  isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-stone-700 border-amber-200'
                }`}
              >
                <span>📁 {f.name}</span>
                {canDelete && (
                  <button onClick={(e) => handleDeleteFolder(f.id, e)} className="hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {displayedQuestions.length === 0 ? (
          <div className="text-center py-10 text-stone-400 font-bold text-xs bg-white rounded-3xl border border-amber-200">
            問題がまだ登録されていません
          </div>
        ) : (
          displayedQuestions.map(q => {
            const isFav = (userProfile.favoriteQIds || []).includes(q.id);
            const isHit = (userProfile.hitQIds || []).includes(q.id);
            const isAuthor = q.uid === userProfile.uid;

            return (
              <div 
                key={q.id} 
                onClick={() => onSelectQuestion(q.id)} 
                className="bg-white p-4 rounded-3xl border border-amber-200/90 shadow-sm hover:shadow-md transition cursor-pointer space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {q.subject}
                    </span>
                    <span className="text-[11px] font-bold text-stone-400">by {q.author || '匿名'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* お気に入りボタン */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(q.id); }} 
                      className="p-1 rounded-full hover:bg-amber-50 transition"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                    </button>

                    {/* 的中「出た！」ボタン（押すとグレーアウトしてロック） */}
                    <button 
                      disabled={isHit}
                      onClick={(e) => handleHitClick(q.id, q.hitCount, e)} 
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition ${
                        isHit 
                          ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed' 
                          : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 active:scale-95'
                      }`}
                    >
                      <Flame className={`w-3.5 h-3.5 ${isHit ? 'text-stone-400 fill-stone-400' : 'text-orange-500 fill-orange-500'}`}/> 
                      {isHit ? `的中済み (${q.hitCount || 0})` : `出た！(${q.hitCount || 0})`}
                    </button>

                    {/* 作成者用 編集＆削除ボタン */}
                    {isAuthor && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEditQuestion(q); }} 
                          className="text-stone-400 hover:text-indigo-600 p-1 transition"
                          title="問題を編集"
                        >
                          <Edit className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteQuestion(q.id, e)} 
                          className="text-stone-400 hover:text-rose-500 p-1 transition"
                          title="問題を削除"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="font-extrabold text-xs text-stone-800 leading-relaxed">
                  Q. {q.subQuestions?.[0]?.question || '無題の問題'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
