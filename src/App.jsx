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
                onOpenFolderModal
