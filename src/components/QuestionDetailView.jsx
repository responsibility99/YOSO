import React, { useState } from 'react';
import { ArrowLeft, Zap, MessageCircle, Send } from 'lucide-react';
import { SUBJECT_ELEMENTS } from './BossBattle';

export default function QuestionDetailView({ 
  question, 
  currentUid, 
  onBack, 
  onAttackBoss, 
  onAddComment 
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [battleLog, setBattleLog] = useState(null);

  if (!question) return null;

  const elemInfo = SUBJECT_ELEMENTS[question.subject] || { name: '✨ 光属性', color: 'bg-amber-400 text-stone-900' };
  const atk = question.atk || 200;

  const handleAttack = () => {
    setShowAnswer(true);
    const isCrit = Math.random() > 0.5;
    const finalDmg = isCrit ? Math.floor(atk * 2) : atk;
    
    onAttackBoss(finalDmg);
    setBattleLog(
      isCrit 
        ? `⚡ 会心の一撃！ クリティカルでボスに ${finalDmg.toLocaleString()} ダメージ！` 
        : `⚔️ 攻撃成功！ ボスに ${finalDmg.toLocaleString()} ダメージ！`
    );
  };

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
        className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-full transition"
      >
        <ArrowLeft className="w-4 h-4" /> 戻る
      </button>

      <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-5 relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${elemInfo.color}`}>
            {elemInfo.name} | {question.subject}
          </span>
          <span className="text-xs font-black text-amber-400 flex items-center gap-1">
            <Zap className="w-4 h-4" /> 攻撃力 {atk}
          </span>
        </div>

        <div className="space-y-4 py-2">
          <div className="text-xs font-extrabold text-slate-400">作成者: {question.author || '匿名'}</div>
          <h3 className="text-base font-black text-slate-100 leading-relaxed">
            Q. {question.subQuestions?.[0]?.question || '問題文がありません'}
          </h3>

          {showAnswer ? (
            <div className="bg-rose-950/60 border border-rose-500/50 p-4 rounded-2xl text-rose-200 font-black text-sm space-y-1">
              <div className="text-[10px] text-rose-400 font-bold">正解・解説</div>
              <div>{question.subQuestions?.[0]?.answer || '解答がありません'}</div>
            </div>
          ) : (
            <button 
              onClick={handleAttack} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-900 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 active:scale-98 transition"
            >
              ⚔️ 正解を確認してボスを攻撃！
            </button>
          )}
        </div>

        {battleLog && (
          <div className="text-center text-xs font-black text-amber-300 bg-amber-950/50 p-3 rounded-2xl border border-amber-500/40 animate-bounce">
            {battleLog}
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
        <h4 className="font-extrabold text-xs text-slate-300 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-amber-400" /> 作戦会議コメント
        </h4>

        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={commentText} 
            onChange={e => setCommentText(e.target.value)} 
            placeholder="この問題の解き方やコツを共有..." 
            className="flex-1 bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs outline-none text-white font-bold focus:border-amber-500 transition"
          />
          <button 
            type="submit" 
            className="bg-amber-500 hover:bg-amber-600 text-stone-900 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {(question.comments || []).length === 0 ? (
            <div className="text-center py-4 text-[11px] text-slate-500 font-bold">まだコメントはありません</div>
          ) : (
            (question.comments || []).map(c => (
              <div key={c.id} className="text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                <span className="font-black text-amber-400 mr-2">{c.user}:</span>
                <span className="text-slate-200 font-bold">{c.text}</span>
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
      <div className="text-center py-12 text-slate-500 font-bold text-xs bg-slate-800 rounded-3xl border border-slate-700">
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
          className="text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full"
        >
          戻る
        </button>
        <span className="text-xs font-black text-amber-400">
          🎴 単語帳モード ({currentIndex + 1} / {questions.length})
        </span>
      </div>

      <div 
        onClick={() => setShowAnswer(!showAnswer)} 
        className="bg-slate-800 min-h-[240px] p-6 rounded-3xl border border-slate-700 flex flex-col justify-between text-center cursor-pointer shadow-2xl transition transform active:scale-98"
      >
        <span className="text-[10px] font-black text-amber-400">{currentQ.subject}</span>
        <div className="text-base font-black text-white px-2 leading-relaxed">
          {showAnswer ? (currentQ.subQuestions?.[0]?.answer || '解答なし') : (currentQ.subQuestions?.[0]?.question || '問題なし')}
        </div>
        <span className="text-[10px] font-bold text-slate-500">タップして裏返す</span>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => { setShowAnswer(false); setCurrentIndex((currentIndex - 1 + questions.length) % questions.length); }} 
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl text-xs font-bold border border-slate-700"
        >
          ◀ 前へ
        </button>
        <button 
          onClick={() => { setShowAnswer(false); setCurrentIndex((currentIndex + 1) % questions.length); }} 
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 py-3 rounded-2xl text-xs font-black shadow-lg"
        >
          次へ ▶
        </button>
      </div>
    </div>
  );
}
