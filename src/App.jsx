import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, FolderPlus, Plus, ThumbsUp, 
  Home, PlusCircle, BarChart2, ArrowLeft, Trash2
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import './index.css';

// 外部コンポーネントの読み込み
import TimerView from './components/TimerView';
import RecordsView from './components/RecordsView';

const SUBJECTS = [
  '国語1', '国語２a', '国語２ｂ', '歴史', '地理', 
  '数学Ａ', '数学Ｂ', '化学', '生物', '地学', 
  '音楽', '英語１', '英語２'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('study_app_user_v3');
    return saved ? JSON.parse(saved) : { name: 'テスト対策生', avatar: '🎓', customAvatar: null };
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [studyLogs, setStudyLogs] = useState(() => {
    const saved = localStorage.getItem('study_app_logs_v3');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'folders'), (snapshot) => {
      setFolders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'questions'), (snapshot) => {
      setQuestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('study_app_user_v3', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('study_app_logs_v3', JSON.stringify(studyLogs));
  }, [studyLogs]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), {
        name: newFolderName,
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  const handleToggleLike = async (qId) => {
    const q = questions.find(item => item.id === qId);
    if (!q) return;
    const qRef = doc(db, 'questions', qId);
    try {
      await updateDoc(qRef, {
        likes: q.likedByMe ? (q.likes - 1) : (q.likes + 1),
        likedByMe: !q.likedByMe
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (window.confirm('この予想問題を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'questions', qId));
        setSelectedQuestionId(null);
      } catch (err) {
        alert('削除に失敗しました');
      }
    }
  };

  const handleSaveStudyLog = (logData) => {
    const newLog = {
      id: 'log_' + Date.now(),
      ...logData
    };
    setStudyLogs([newLog, ...studyLogs]);
    setActiveTab('records');
  };

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 flex flex-col font-sans pb-24">
      <header className="bg-white border-b border-amber-200 sticky top-0 z-30 shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); }}>
          <div className="bg-amber-600 text-white p-2 rounded-xl"><BookOpen className="w-5 h-5" /></div>
          <h1 className="font-extrabold text-lg">定期テスト予想問題</h1>
        </div>
        <button onClick={() => setShowProfileModal(true)} className="bg-amber-100 px-3 py-1.5 rounded-full text-sm font-medium">
          {userProfile?.avatar || '🎓'} {userProfile?.name || 'テスト対策生'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex-1 w-full">
        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)} 
            onBack={() => setSelectedQuestionId(null)}
            onDelete={handleDeleteQuestion}
            onAddComment={async (qId, text) => {
              const q = questions.find(item => item.id === qId);
              if (!q) return;
              const qRef = doc(db, 'questions', qId);
              const newComments = [...(q.comments || []), { id: 'c_' + Date.now(), user: userProfile?.name || "名無し", text }];
              await updateDoc(qRef, { comments: newComments });
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView 
                folders={folders}
                questions={questions}
                onSelectQuestion={(id) => setSelectedQuestionId(id)}
                onOpenFolderModal={() => setShowFolderModal(true)}
                onToggleLike={handleToggleLike}
              />
            )}
            {activeTab === 'create' && (
              <CreateQuestionView 
                folders={folders}
                defaultFolderId={selectedFolderId || (folders[0] ? folders[0].id : '')}
                userProfile={userProfile}
                onSuccess={() => setActiveTab('home')}
              />
            )}
            {activeTab === 'timer' && (
              <TimerView onSaveLog={handleSaveStudyLog} />
            )}
            {activeTab === 'records' && (
              <RecordsView studyLogs={studyLogs} onClearLogs={() => setStudyLogs([])} />
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 z-30 flex justify-around">
        <NavButton active={activeTab === 'home'} icon={<Home className="w-5 h-5" />} label="ホーム" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'create'} icon={<PlusCircle className="w-5 h-5" />} label="投稿する" onClick={() => { setActiveTab('create'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'timer'} icon={<Clock className="w-5 h-5" />} label="タイマー" onClick={() => { setActiveTab('timer'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'records'} icon={<BarChart2 className="w-5 h-5" />} label="分析・記録" onClick={() => { setActiveTab('records'); setSelectedQuestionId(null); }} />
      </nav>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-bold">プロフィール設定</h3>
            <input type="text" value={userProfile?.name || ''} onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })} className="w-full border p-2 rounded-xl text-sm" />
            <button onClick={() => setShowProfileModal(false)} className="w-full bg-amber-600 text-white py-2 rounded-xl text-xs font-bold">保存する</button>
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-bold">新規フォルダ作成</h3>
            <input type="text" required value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="フォルダ名" className="w-full border p-2 rounded-xl text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowFolderModal(false)} className="px-3 py-1 text-sm">キャンセル</button>
              <button type="submit" className="bg-amber-600 text-white px-4 py-1 rounded-xl text-sm">作成</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center text-xs ${active ? 'text-amber-700 font-bold' : 'text-stone-400'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CreateQuestionView({ folders, defaultFolderId, userProfile, onSuccess }) {
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [title, setTitle] = useState('');
  const [subQuestions, setSubQuestions] = useState([{ question: '', answer: '' }]);

  const handleSubQuestionChange = (index, field, value) => {
    const updated = [...subQuestions];
    updated[index][field] = value;
    setSubQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newQuestion = {
      folderId,
      subject,
      title,
      author: userProfile?.name || "名無しユーザー",
      avatar: userProfile?.avatar || "🎓",
      customAvatar: userProfile?.customAvatar || null,
      likes: 0,
      likedByMe: false,
      subQuestions,
      comments: [],
      createdAt: new Date().toLocaleDateString('ja-JP')
    };

    try {
      await addDoc(collection(db, 'questions'), newQuestion);
      alert('予想問題を投稿しました！');
      onSuccess();
    } catch (err) {
      alert('投稿に失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl space-y-4 shadow-sm border border-stone-200 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold flex items-center gap-2"><PlusCircle className="w-5 h-5 text-amber-600" /> 予想問題を投稿</h2>
      <div>
        <label className="text-xs text-stone-500">フォルダ</label>
        <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="w-full border p-2 rounded-xl text-sm">{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
      </div>
      <div>
        <label className="text-xs text-stone-500">教科</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border p-2 rounded-xl text-sm">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
      </div>
      <div>
        <label className="text-xs text-stone-500">タイトル</label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded-xl text-sm" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-stone-500">問題と解答</label>
        {subQuestions.map((sq, i) => (
          <div key={i} className="p-3 bg-stone-50 rounded-xl space-y-1 border">
            <input type="text" value={sq.question} onChange={(e) => handleSubQuestionChange(i, 'question', e.target.value)} placeholder="問題" className="w-full border p-1.5 rounded text-xs bg-white" />
            <input type="text" value={sq.answer} onChange={(e) => handleSubQuestionChange(i, 'answer', e.target.value)} placeholder="解答" className="w-full border p-1.5 rounded text-xs bg-white" />
          </div>
        ))}
        <button type="button" onClick={() => setSubQuestions([...subQuestions, { question: '', answer: '' }])} className="w-full py-1 border border-dashed border-amber-400 text-amber-800 rounded-xl text-xs">+ 問題を追加</button>
      </div>
      <button type="submit" className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold">公開する</button>
    </form>
  );
}

// === ここが答えを隠す機能が入った新しい部分 ===
function QuestionDetailView({ question, onBack, onDelete, onAddComment }) {
  const [commentText, setCommentText] = useState('');
  const [showAnswers, setShowAnswers] = useState({});

  if (!question) return null;

  const toggleAnswer = (index) => {
    setShowAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-amber-700"><ArrowLeft className="w-4 h-4" /> 戻る</button>
        <button onClick={() => onDelete(question.id)} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg"><Trash2 className="w-3.5 h-3.5" /> 投稿を削除</button>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{question.subject}</span>
        <h2 className="text-lg font-bold">{question.title}</h2>
        <p className="text-xs text-stone-400">投稿者: {question.author || '名無しユーザー'}</p>
        <div className="space-y-2 pt-2 border-t">
          {(question.subQuestions || []).map((sq, i) => (
            <div key={i} className="p-3 bg-amber-50 rounded-xl">
              <p className="font-bold text-xs">問{i+1}: {sq.question}</p>
              <div className="mt-2">
                {showAnswers[i] ? (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-900 bg-white p-2 rounded border border-amber-200 font-bold">答: {sq.answer}</p>
                    <button onClick={() => toggleAnswer(i)} className="text-[10px] text-stone-500 underline">答えを隠す</button>
                  </div>
                ) : (
                  <button onClick={() => toggleAnswer(i)} className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded-lg font-bold transition">
                    答えを見る
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
        <h3 className="font-bold text-sm">コメント</h3>
        <div className="flex gap-2">
          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="コメント..." className="flex-1 border p-2 rounded-xl text-xs" />
          <button onClick={() => { if (commentText) { onAddComment(question.id, commentText); setCommentText(''); } }} className="bg-amber-600 text-white px-3 py-1 rounded-xl text-xs">送信</button>
        </div>
        <div className="space-y-1 pt-2">
          {(question.comments || []).map(c => (
            <div key={c.id} className="text-xs bg-stone-50 p-2 rounded-xl"><span className="font-bold">{c.user}: </span>{c.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeView({ folders, questions, onSelectQuestion, onOpenFolderModal, onToggleLike }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold">テスト対策フォルダ</h2>
          <button onClick={onOpenFolderModal} className="text-xs text-amber-800 font-bold bg-amber-100 px-3 py-1.5 rounded-lg">フォルダを作成</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {folders.map(f => (
            <div key={f.id} className="bg-white p-4 rounded-xl border border-stone-200">
              <h3 className="font-bold text-sm">{f.name}</h3>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-base font-bold mb-3">最新の予想問題</h2>
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} onClick={() => onSelectQuestion(q.id)} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm cursor-pointer space-y-2">
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{q.subject}</span>
              <h3 className="font-bold text-base">{q.title}</h3>
              <div className="flex justify-between items-center text-xs text-stone-500 border-t pt-2">
                <span>投稿者: {q.author || '名無しユーザー'}</span>
                <button onClick={(e) => { e.stopPropagation(); onToggleLike(q.id); }} className="flex items-center gap-1 font-semibold text-amber-700">
                  <ThumbsUp className="w-3.5 h-3.5" /> {q.likes || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
