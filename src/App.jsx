import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Calendar, FolderPlus, Plus, ThumbsUp, 
  MessageSquare, Home, PlusCircle, BarChart2, CheckCircle, 
  Trash2, ChevronDown, ChevronUp, ArrowLeft, Play, Pause, RotateCcw, 
  Award, Sparkles, Edit3, TrendingUp, PieChart, Zap, AlertCircle, Camera, QrCode, X
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import './index.css';

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
  const [showQrModal, setShowQrModal] = useState(false);

  const [examConfig, setExamConfig] = useState(() => {
    const saved = localStorage.getItem('study_app_exam_v3');
    return saved ? JSON.parse(saved) : { name: '', date: '' };
  });
  const [isEditingExam, setIsEditingExam] = useState(false);

  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [studyLogs, setStudyLogs] = useState(() => {
    const saved = localStorage.getItem('study_app_logs_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [deleteConfirmQId, setDeleteConfirmQId] = useState(null);

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
    localStorage.setItem('study_app_exam_v3', JSON.stringify(examConfig));
  }, [examConfig]);

  useEffect(() => {
    localStorage.setItem('study_app_logs_v3', JSON.stringify(studyLogs));
  }, [studyLogs]);

  const calculateDaysLeft = (targetDateStr) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(examConfig.date);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), {
        name: newFolderName,
        description: newFolderDesc || '教科書・テスト範囲のまとめ',
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      setNewFolderDesc('');
      setShowFolderModal(false);
    } catch (err) {
      alert('フォルダ作成中にエラーが発生しました');
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
    try {
      await deleteDoc(doc(db, 'questions', qId));
      setDeleteConfirmQId(null);
      setSelectedQuestionId(null);
    } catch (err) {
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 flex flex-col font-sans pb-24 md:pb-8">
      <header className="bg-white border-b border-amber-200/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => { setActiveTab('home'); setSelectedFolderId(null); setSelectedQuestionId(null); }}
          >
            <div className="bg-gradient-to-tr from-amber-600 to-orange-500 text-white p-2 rounded-xl shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-stone-800 tracking-tight leading-none">定期テスト予想問題</h1>
              <span className="text-xs text-amber-700 font-semibold">YOSO</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowQrModal(true)}
              className="p-2 text-amber-800 bg-amber-100/60 hover:bg-amber-100 rounded-full border border-amber-200/80 transition"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 bg-amber-100/60 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-all text-sm font-medium border border-amber-200/80 text-amber-900"
            >
              <UserAvatar avatar={userProfile?.avatar} customAvatar={userProfile?.customAvatar} size="w-6 h-6" />
              <span className="max-w-[100px] truncate">{userProfile?.name || 'テスト対策生'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full">
        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)} 
            onBack={() => setSelectedQuestionId(null)}
            userProfile={userProfile}
            onToggleLike={handleToggleLike}
            onPromptDelete={(qId) => setDeleteConfirmQId(qId)}
            onAddComment={async (qId, text) => {
              const q = questions.find(item => item.id === qId);
              if (!q) return;
              const qRef = doc(db, 'questions', qId);
              const newComments = [...(q.comments || []), {
                id: 'c_' + Date.now(),
                user: userProfile?.name || "名無しユーザー",
                avatar: userProfile?.avatar || "🎓",
                text,
                time: 'たった今'
              }];
              await updateDoc(qRef, { comments: newComments });
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView 
                examConfig={examConfig}
                daysLeft={daysLeft}
                setIsEditingExam={setIsEditingExam}
                folders={folders}
                questions={questions}
                onSelectFolder={(id) => setSelectedFolderId(id)}
                onSelectQuestion={(id) => setSelectedQuestionId(id)}
                onOpenFolderModal={() => setShowFolderModal(true)}
                onToggleLike={handleToggleLike}
                onGoToCreate={() => setActiveTab('create')}
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
            {activeTab === 'timer' && <TimerView onSaveLog={(log) => setStudyLogs([log, ...studyLogs])} />}
            {activeTab === 'records' && <RecordsView studyLogs={studyLogs} />}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-amber-200/80 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <NavButton active={activeTab === 'home'} icon={<Home className="w-5 h-5" />} label="ホーム" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); }} />
          <NavButton active={activeTab === 'create'} icon={<PlusCircle className="w-5 h-5" />} label="投稿する" onClick={() => { setActiveTab('create'); setSelectedQuestionId(null); }} />
          <NavButton active={activeTab === 'timer'} icon={<Clock className="w-5 h-5" />} label="タイマー" onClick={() => { setActiveTab('timer'); setSelectedQuestionId(null); }} />
          <NavButton active={activeTab === 'records'} icon={<BarChart2 className="w-5 h-5" />} label="分析・記録" onClick={() => { setActiveTab('records'); setSelectedQuestionId(null); }} />
        </div>
      </nav>

      {showProfileModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-800">プロフィール設定</h3>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">表示名</label>
              <input 
                type="text" 
                value={userProfile?.name || ''}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm outline-none"
              />
            </div>
            <button onClick={() => setShowProfileModal(false)} className="w-full bg-amber-600 text-white py-2 rounded-xl text-xs font-bold">
              保存する
            </button>
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-800">新規フォルダ作成</h3>
            <input type="text" required value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="フォルダ名" className="w-full border p-2.5 rounded-xl text-sm outline-none" />
            <input type="text" value={newFolderDesc} onChange={(e) => setNewFolderDesc(e.target.value)} placeholder="説明（任意）" className="w-full border p-2.5 rounded-xl text-sm outline-none" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-sm text-stone-600">キャンセル</button>
              <button type="submit" className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-semibold">作成する</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function CreateQuestionView({ folders, defaultFolderId, userProfile, onSuccess }) {
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [title, setTitle] = useState('');
  const [subQuestions, setSubQuestions] = useState([{ question: '', answer: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // 安全にデータを準備（プロフィール変更後もエラーにならない仕組み）
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl space-y-4 shadow-sm border border-stone-200">
      <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-amber-600" /> 新しい予想問題を投稿する
      </h2>
      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1">タイトル</label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 2学期中間・過去問パターン" className="w-full border p-2.5 rounded-xl text-sm outline-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1">教科</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm outline-none">
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button type="submit" className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-amber-700 transition">
        予想問題を公開する
      </button>
    </form>
  );
}

function QuestionDetailView({ question, onBack, userProfile, onToggleLike, onPromptDelete, onAddComment }) {
  const [commentText, setCommentText] = useState('');

  if (!question) return null;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-amber-700">
        <ArrowLeft className="w-4 h-4" /> 戻る
      </button>
      <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">{question.subject}</span>
        <h2 className="text-lg font-bold text-stone-800">{question.title}</h2>
        <p className="text-xs text-stone-400">投稿者: {question.author || '名無しユーザー'}</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
        <h3 className="font-bold text-sm">コメント</h3>
        <div className="flex gap-2">
          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="コメントを書く..." className="flex-1 border p-2 rounded-xl text-xs outline-none" />
          <button onClick={() => { if (commentText) { onAddComment(question.id, commentText); setCommentText(''); } }} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold">送信</button>
        </div>
        <div className="space-y-2 pt-2">
          {(question.comments || []).map(c => (
            <div key={c.id} className="text-xs bg-stone-50 p-2.5 rounded-xl">
              <span className="font-bold text-stone-700">{c.user}: </span>
              <span className="text-stone-600">{c.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ avatar, customAvatar, size = "w-8 h-8", textStyle = "text-base" }) {
  if (customAvatar) {
    return <img src={customAvatar} alt="Avatar" className={`${size} rounded-full object-cover border border-amber-300 flex-shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full bg-amber-100 flex items-center justify-center ${textStyle} border border-amber-200 flex-shrink-0`}>
      {avatar || '🎓'}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${active ? 'text-amber-700 font-bold scale-105' : 'text-stone-400'}`}>
      {icon}
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function HomeView({ examConfig, daysLeft, setIsEditingExam, folders, questions, onSelectFolder, onSelectQuestion, onOpenFolderModal, onToggleLike, onGoToCreate }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-5 text-white shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">テスト勉強をスタートしよう！</h2>
          <p className="text-xs text-amber-100 mt-1">{examConfig.date ? `試験日: ${examConfig.date}` : '試験日未設定'}</p>
        </div>
        <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
          <span className="text-xs">残り日数</span>
          <p className="text-lg font-bold">{daysLeft !== null ? `${daysLeft}日` : '-'}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-stone-800">テスト対策フォルダ</h2>
          <button onClick={onOpenFolderModal} className="text-xs text-amber-800 font-bold bg-amber-100 px-3 py-1.5 rounded-lg">フォルダを作成</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {folders.map(f => (
            <div key={f.id} onClick={() => onSelectFolder(f.id)} className="bg-white p-4 rounded-xl border border-stone-200 cursor-pointer">
              <h3 className="font-bold text-stone-800">{f.name}</h3>
              <p className="text-xs text-stone-500">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-stone-800 mb-3">最新の予想問題</h2>
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} onClick={() => onSelectQuestion(q.id)} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm cursor-pointer space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md">{q.subject}</span>
              </div>
              <h3 className="font-bold text-stone-800 text-base">{q.title}</h3>
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

function TimerView({ onSaveLog }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  return (
    <div className="bg-white p-6 rounded-2xl text-center space-y-4 border border-amber-100">
      <h2 className="text-lg font-bold text-stone-800">勉強タイマー</h2>
      <div className="text-4xl font-extrabold text-amber-600">
        {Math.floor(seconds / 60)}分 {seconds % 60}秒
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={() => setIsActive(!isActive)} className="bg-amber-600 text-white px-6 py-2 rounded-xl text-xs font-bold">
          {isActive ? '一時停止' : 'スタート'}
        </button>
        <button onClick={() => { setSeconds(0); setIsActive(false); }} className="bg-stone-100 text-stone-600 px-4 py-2 rounded-xl text-xs font-bold">
          リセット
        </button>
      </div>
    </div>
  );
}

function RecordsView({ studyLogs }) {
  return (
    <div className="bg-white p-6 rounded-2xl space-y-4 border border-amber-100">
      <h2 className="text-lg font-bold text-stone-800">学習記録</h2>
      {studyLogs.length === 0 ? (
        <p className="text-xs text-stone-400">まだ記録がありません。</p>
      ) : (
        <ul className="space-y-2">
          {studyLogs.map((log, index) => (
            <li key={index} className="text-xs p-2 bg-stone-50 rounded-lg flex justify-between">
              <span>{log.subject || '自習'}</span>
              <span className="font-bold">{log.minutes || 0}分</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
