import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { SUBJECT_ELEMENTS } from './PvPBattle';

export default function QuestionDetailView({ 
  question, 
  currentUid, 
  onBack, 
  onAddComment 
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [commentText, setCommentText] = useState('');

  if (!question) return null;

  const elemInfo = SUBJECT_ELEMENTS[question.subject] || { name: '✨ 光属性', color: 'bg-amber-400 text-stone-900' };

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
          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${elemInfo.color}`}>
            {elemInfo.name} | {question.subject}
          </span>
          <span className="text-xs font-bold text-stone-400">
            作成者: {question.author || '匿名'}
          </span>
        </div>

        <div className="space-y-4 py-2">
          <h3 className="text-base font-black text-stone-800 leading-relaxed">
            Q. {question.subQuestions?.[0]?.question || '問題文がありません'}
          </h3>

          {showAnswer ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-stone-800 font-bold text-sm space-y-1">
              <div className="text-[10px] text-amber-600 font-bold">正解・解説</div>
              <div>{question.subQuestions?.[0]?.answer || '解答がありません'}</div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAnswer(true)} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3.5 rounded-2xl font-black text-sm shadow-md transition"
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

export function FlashcardView({ questions, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400 font-bold text-xs bg-white rounded-3xl border border-amber-200">
        カードがありません
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full">
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack} 
          className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full"
        >
          戻る
        </button>
        <span className="text-xs font-black text-amber-600">
          🎴 暗記カード ({currentIndex + 1} / {questions.length})
        </span>
      </div>

      <div 
        onClick={() => setShowAnswer(!showAnswer)} 
        className="bg-white min-h-[240px] p-6 rounded-3xl border border-amber-200 flex flex-col justify-between text-center cursor-pointer shadow-lg transition transform active:scale-98"
      >
        <span className="text-[10px] font-black text-amber-600">{currentQ.subject}</span>
        <div className="text-base font-black text-stone-800 px-2 leading-relaxed">
          {showAnswer ? (currentQ.subQuestions?.[0]?.answer || '解答なし') : (currentQ.subQuestions?.[0]?.question || '問題なし')}
        </div>
        <span className="text-[10px] font-bold text-stone-400">タップして裏返す</span>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => { setShowAnswer(false); setCurrentIndex((currentIndex - 1 + questions.length) % questions.length); }} 
          className="flex-1 bg-white hover:bg-amber-50 text-stone-700 py-3 rounded-2xl text-xs font-bold border border-amber-200 shadow-sm"
        >
          ◀ 前へ
        </button>
        <button 
          onClick={() => { setShowAnswer(false); setCurrentIndex((currentIndex + 1) % questions.length); }} 
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl text-xs font-black shadow-md"
        >
          次へ ▶
        </button>
      </div>
    </div>
  );
}
