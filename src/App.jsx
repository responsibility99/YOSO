import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Clock, FolderPlus, ThumbsUp, 
  Home, PlusCircle, BarChart2, ArrowLeft, Trash2, Calendar, Sparkles,
  MessageCircle, Send, Trophy, Medal, Flame, KeyRound, LogOut
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, query, orderBy, limit 
} from 'firebase/firestore';
import './index.css';

import TimerView from './components/TimerView';
import RecordsView from './components/RecordsView';

const SUBJECTS = [
  '国語1', '国語２a', '国語２ｂ', '歴史', '地理', 
  '数学Ａ', '数学Ｂ', '化学', '生物', '地学', 
  '音楽', '英語１', '英語２'
];

const BADGES = [
  { id: 't1', icon: '🐣', name: 'ひよこ', desc: 'タイマー記録1回', type: 'totalStudySessions', req: 1 },
  { id: 't2', icon: '⏱️', name: '時計の友', desc: 'タイマー記録5回', type: 'totalStudySessions', req: 5 },
  { id: 't3', icon: '🕰️', name: '時の支配者', desc: 'タイマー記録20回', type: 'totalStudySessions', req: 20 },
  { id: 'p1', icon: '🌱', name: '初投稿', desc: '問題を1回投稿', type: 'totalPosts', req: 1 },
  { id: 'p2', icon: '🛠️', name: '問題職人', desc: '問題を5回投稿', type: 'totalPosts', req: 5 },
  { id: 'c1', icon: '👋', name: '初めまして', desc: 'チャット1回送信', type: 'totalChats', req: 1 },
  { id: 'c2', icon: '💬', name: 'おしゃべり', desc: 'チャット10回送信', type: 'totalChats', req: 10 },
  { id: 'l1', icon: '🥉', name: 'ルーキー', desc: 'レベル5到達', type: 'level', req: 5 },
  { id: 'l2', icon: '🥈', name: 'チャレンジャー', desc: 'レベル10到達', type: 'level', req: 10 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('study_app_user_v6');
    const defaultUid = 'user_' + Date.now() + Math.floor(Math.random()*1000);
    return saved ? JSON.parse(saved) : { 
      uid: defaultUid, name: 'テスト対策生', avatar: '🎓', testDate: '',
      xp: 0, level: 1, totalStudySessions: 0, totalPosts: 0, totalChats: 0, secretCode: '' 
    };
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // 合言葉入力用
  const [tempCode, setTempCode] = useState('');

  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showManualLogModal, setShowManualLogModal] = useState(false);
  const [manualLog, setManualLog] = useState({ subject: SUBJECTS[0], minutes: 30 });
  const [questions, setQuestions] = useState([]);
  const [studyLogs, setStudyLogs] = useState(() => {
    const saved = localStorage.getItem('study_app_logs_v6');
    return saved ? JSON.parse(saved) : [];
  });
  const [leaderboard, setLeaderboard] = useState([]);

  // 合言葉に基づくデータ取得
  useEffect(() => {
    if (!userProfile.secretCode) return;
    const unsub = onSnapshot(collection(db, 'folders'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(data.filter(d => d.secretCode === userProfile.secretCode));
    });
    return () => unsub();
  }, [userProfile.secretCode]);

  useEffect(() => {
    if (!userProfile.secretCode) return;
    const unsub = onSnapshot(collection(db, 'questions'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuestions(data.filter(d => d.secretCode === userProfile.secretCode));
    });
    return () => unsub();
  }, [userProfile.secretCode]);

  useEffect(() => {
    if (!userProfile.secretCode) return;
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeaderboard(data.filter(d => d.secretCode === userProfile.secretCode).slice(0, 30));
    });
    return () => unsub();
  }, [userProfile.secretCode]);

  useEffect(() => {
    localStorage.setItem('study_app_user_v6', JSON.stringify(userProfile));
    localStorage.setItem('study_app_logs_v6', JSON.stringify(studyLogs));
    
    if (userProfile.uid && userProfile.secretCode) {
      const userRef = doc(db, 'users', userProfile.uid);
      setDoc(userRef, userProfile, { merge: true }).catch(e => console.error(e));
    }
  }, [userProfile, studyLogs]);

  const gainXP = (amount, statToIncrement) => {
    setUserProfile(prev => {
      const newXp = (prev.xp || 0) + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      if (newLevel > prev.level) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      const updates = { xp: newXp, level: newLevel };
      if (statToIncrement) updates[statToIncrement] = (prev[statToIncrement] || 0) + 1;
      return { ...prev, ...updates };
    });
  };

  const getDaysUntilTest = () => {
    if (!userProfile.testDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = new Date(userProfile.testDate) - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysUntilTest = getDaysUntilTest();
  const earnedBadges = BADGES.filter(b => (userProfile[b.type] || 0) >= b.req);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), { name: newFolderName, secretCode: userProfile.secretCode, createdAt: serverTimestamp() });
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (err) {}
  };

  const handleToggleLike = async (qId) => {
    const q = questions.find(item => item.id === qId);
    if (!q) return;
    try {
      await updateDoc(doc(db, 'questions', qId), { likes: q.likedByMe ? (q.likes - 1) : (q.likes + 1), likedByMe: !q.likedByMe });
    } catch (err) {}
  };

  const handleSaveStudyLog = (logData) => {
    setStudyLogs([{ id: 'log_' + Date.now(), ...logData }, ...studyLogs]);
    gainXP(30, 'totalStudySessions');
    setActiveTab('records');
  };

  // 合言葉入力画面
  if (!userProfile.secretCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6">
          <div className="bg-amber-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-2">
            <KeyRound className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-800">グループに参加</h1>
          <p className="text-sm font-bold text-stone-500">仲間と同じ合言葉を入力して、<br/>専用の学習ルームに入ろう！</p>
          <form onSubmit={(e) => { e.preventDefault(); if(tempCode.trim()) setUserProfile({...userProfile, secretCode: tempCode.trim()}); }}>
            <input type="text" required value={tempCode} onChange={e => setTempCode(e.target.value)} placeholder="例: class2a" className="w-full border-2 border-stone-200 focus:border-amber-500 p-4 rounded-2xl text-center text-lg font-extrabold outline-none transition mb-4" />
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-extrabold shadow-lg transition transform hover:scale-105">ルームに入る</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 text-stone-800 flex flex-col font-sans pb-24">
      {showLevelUp && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl font-extrabold text-lg flex items-center gap-2 border-4 border-white">
            <Flame className="w-6 h-6 text-yellow-100" /> レベルアップ！ Lv.{userProfile.level}
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 sticky top-0 z-30 shadow-lg p-4 flex justify-between items-center rounded-b-2xl">
        <div className="flex items-center gap-2 cursor-pointer text-white" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); }}>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><BookOpen className="w-5 h-5 text-white" /></div>
          <h1 className="font-extrabold text-lg drop-shadow-md">YOSO</h1>
        </div>
        <button onClick={() => setShowProfileModal(true)} className="bg-white/90 hover:bg-white text-stone-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-md transition transform hover:scale-105 flex items-center gap-2">
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">Lv.{userProfile.level}</span>
          <span>{userProfile.avatar} {userProfile.name}</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex-1 w-full flex flex-col">
        {activeTab === 'home' &&
