import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Calendar, FolderPlus, Plus, Search, ThumbsUp, 
  MessageSquare, User, Home, PlusCircle, BarChart2, CheckCircle, 
  Trash2, ChevronDown, ChevronUp, ArrowLeft, Play, Pause, RotateCcw, 
  Settings, Award, Sparkles, Filter, Edit3, Flame,
  TrendingUp, PieChart, Layers, CheckCircle2, Zap, AlertCircle, Camera, QrCode, X
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

const SUBJECT_COLORS = [
  'bg-amber-500', 'bg-orange-500', 'bg-amber-600', 'bg-yellow-500', 'bg-emerald-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-purple-500', 'bg-fuchsia-500', 'bg-rose-500'
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
      const folderList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(folderList);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'questions'), (snapshot) => {
      const qList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuestions(qList);
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
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      alert('エラーが発生しました');
    }
  };

  const handleAddStudyLog = (logData) => {
    const newLog = {
      id: 'log_' + Date.now(),
      subject: logData.subject,
      minutes: logData.minutes,
      timestamp: new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      dateISO: new Date().toISOString().split('T')[0]
    };
    setStudyLogs([newLog, ...studyLogs]);
    setActiveTab('records');
  };

  const handleToggleLike = async (qId) => {
    const q = questions.find(item => item.id === qId);
    if (!q) return;
    const qRef = doc(db, 'questions', qId);
    const isLiked = q.likedByMe;
    try {
      await updateDoc(qRef, {
        likes: isLiked ? (q.likes - 1) : (q.likes + 1),
        likedByMe: !isLiked
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
      alert('削除できませんでした');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('画像サイズは2MB以下にしてください。');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({
          ...prev,
          customAvatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

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
              title="QRコードで共有"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 bg-amber-100/60 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-all text-sm font-medium border border-amber-200/80 text-amber-900"
            >
              <UserAvatar avatar={userProfile.avatar} customAvatar={userProfile.customAvatar} size="w-6 h-6" />
              <span className="max-w-[100px] truncate">{userProfile.name}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full">
        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)}
