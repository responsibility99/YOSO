import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { SUBJECTS } from './PvPBattle';

export default function QuestionDetailView({ 
  question, 
  currentUid, 
  onBack, 
  onAddComment 
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [commentText, setCommentText] = useState('');

  if (!question) return null;

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(question.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto w-full">
      <button 
        onClick={onBack} 
        className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 px-3 py-1.5 rounded-full transition"
      >
        <ArrowLeft className="w-4 h-4" /> 戻る
      </button>

      <div className="bg-white p-6 rounded-3xl border border-amber-200 space-y-5 shadow-lg">
        <div className="flex justify-between items-center">
          <span className="bg-amber-100 text-amber-800 font-black text-[10px] px-3 py-1 rounded-full">
            {question.subject}
          </span>
          <span className="text-xs font-bold text-stone-400">
            作成者: {question.author || '匿名'}
          </span>
        </div>

        <div className="space-y-6 py-2">
          {(question.subQuestions || []).map((sub, idx) => (
            <div key={idx} className="space-y-3 border-b border-amber-100 pb-4 last:border-b-0 last:pb-0">
              <h3 className="text-sm font-black text-stone-800 leading-relaxed">
                Q{idx + 1}. {sub.question}
              </h3>

              {showAnswer ? (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-stone-800 font-bold text-xs space-y-1">
                  <div className="text-[10px] text-amber-600 font-bold">解答・解説</div>
                  <div>{sub.answer || '解答がありません'}</div>
                </div>
              ) : null}
            </div>
          ))}

          {!showAnswer && (
            <button 
              onClick={() => setShowAnswer(true)} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3.5 rounded-2xl font-black text-xs shadow-md transition"
            >
              正解・解説を表示する
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-amber-200 space-y-4 shadow-md">
        <h4 className="font-extrabold text-xs text-stone-700 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-amber-500" /> コメント
        </h4>

        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={commentText} 
            onChange={e => setCommentText(e.target.value)} 
            placeholder="解き方のコツなどをコメント..." 
            className="flex-1 bg-amber-50/50 border border-amber-200 p-2.5 rounded-xl text-xs outline-none text-stone-800 font-bold focus:border-amber-400"
          />
          <button 
            type="submit" 
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {(question.comments || []).length === 0 ? (
            <div className="text-center py-4 text-[11px] text-stone-400 font-bold">まだコメントはありません</div>
          ) : (
            (question.comments || []).map(c => (
              <div key={c.id} className="text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                <span className="font-black text-amber-700 mr-2">{c.user}:</span>
                <span className="text-stone-800 font-bold">{c.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 暗記カード View（フォルダ絞り込み ＋ 教科絞り込み機能付き）
export function FlashcardView({ questions, folders, onBack }) {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [memorizedIds, setMemorizedIds] = useState([]);

  // フォルダ ＆ 教科のW絞り込み
  const filteredQuestions = questions.filter(q => {
    const matchFolder = selectedFolder === 'all' || q.folderId === selectedFolder;
    const matchSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    return matchFolder && matchSubject;
  });

  if (filteredQuestions.length === 0) {
    return (
      <div className="space-y-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <button onClick={onBack} className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full">戻る</button>
            <span className="text-xs font-black text-stone-500">条件に合うカードがありません</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select 
              value={selectedFolder} 
              onChange={e => { setSelectedFolder(e.target.value); setCurrentIndex(0); setShowAnswer(false); }} 
              className="bg-white border border-amber-200 p-2 rounded-xl text-xs font-bold text-stone-800 shadow-sm"
            >
              <option value="all">すべてのフォルダ</option>
              {folders.map(f => <option key={f.id} value={f.id}>📁 {f.name}</option>)}
            </select>
            <select 
              value={selectedSubject} 
              onChange={e => { setSelectedSubject(e.target.value); setCurrentIndex(0); setShowAnswer(false); }} 
              className="bg-white border border-amber-200 p-2 rounded-xl text-xs font-bold text-stone-800 shadow-sm"
            >
              <option value="all">すべての教科</option>
              {SUBJECTS.map(s => <option key={s} value={s}>📚 {s}</option>)}
            </select>
          </div>
        </div>
        <div className="text-center py-12 text-stone-400 font-bold text-xs bg-white rounded-3xl border border-amber-200">
          該当するカードがありません。条件を変えてみてください！
        </div>
      </div>
    );
  }

  const currentQ = filteredQuestions[currentIndex % filteredQuestions.length];
  const isMemorized = memorizedIds.includes(currentQ.id);

  const toggleMemorized = (e) => {
    e.stopPropagation();
    setMemorizedIds(prev => 
      prev.includes(currentQ.id) 
        ? prev.filter(id => id !== currentQ.id) 
        : [...prev, currentQ.id]
    );
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full">戻る</button>
          <span className="text-xs font-black text-amber-600">
            🎴 ({((currentIndex % filteredQuestions.length) + 1)} / {filteredQuestions.length})
          </span>
        </div>

        {/* 絞り込みドロップダウン（フォルダ ＆ 教科） */}
        <div className="grid grid-cols-2 gap-2">
          <select 
            value={selectedFolder} 
            onChange={e => { setSelectedFolder(e.target.value); setCurrentIndex(0); setShowAnswer(false); }} 
            className="bg-white border border-amber-200 p-2 rounded-xl text-xs font-bold text-stone-800 shadow-sm outline-none focus:border-amber-400"
          >
            <option value="all">すべてのフォルダ</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>📁 {f.name}</option>
            ))}
          </select>

          <select 
            value={selectedSubject} 
            onChange={e => { setSelectedSubject(e.target.value); setCurrentIndex(0); setShowAnswer(false); }} 
            className="bg-white border border-amber-200 p-2 rounded-xl text-xs font-bold text-stone-800 shadow-sm outline-none focus:border-amber-400"
          >
            <option value="all">すべての教科</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>📚 {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* カード本体 */}
      <div 
        onClick={() => setShowAnswer(!showAnswer)} 
        className={`bg-white min-h-[250px] p-6 rounded-3xl border-2 flex flex-col justify-between text-center cursor-pointer shadow-lg transition ${
          isMemorized ? 'border-emerald-400 bg-emerald-50/20' : 'border-amber-200'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">{currentQ.subject}</span>
          <button 
            onClick={toggleMemorized}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 ${
              isMemorized ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-emerald-100 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5"/> {isMemorized ? '覚えた！' : 'まだ'}
          </button>
        </div>

        <div className="text-base font-black text-stone-800 px-2 leading-relaxed">
          {showAnswer 
            ? (currentQ.subQuestions?.[0]?.answer || '解答なし') 
            : (currentQ.subQuestions?.[0]?.question || '問題なし')
          }
        </div>

        <span className="text-[10px] font-bold text-stone-400">タップして裏返す</span>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => { setShowAnswer(false); setCurrentIndex((currentIndex - 1 + filteredQuestions.length) % filteredQuestions.length); }} 
          className="flex-1 bg-white hover:bg-amber-50 text-stone-700 py-3 rounded-2xl text-xs font-bold border border-amber-200 shadow-sm"
        >
          ◀ 前へ
        </button>
        <button 
          onClick={() => { setShowAnswer(false); setCurrentIndex((currentIndex + 1) % filteredQuestions.length); }} 
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl text-xs font-black shadow-md"
        >
          次へ ▶
        </button>
      </div>
    </div>
  );
}
