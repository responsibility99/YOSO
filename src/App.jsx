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

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const [userProfile, setUserProfile] = useState(() ="> {
    const saved = localStorage.getItem('study_app_user_v3');
    return saved ? JSON.parse(saved) : { name: 'テスト対策生', avatar: '🎓', customAvatar: null };
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [examConfig, setExamConfig] = useState(() => {
    const saved = localStorage.getItem('study_app_exam_v3');
    return saved ? JSON.parse(saved) : { name: '', date: '' };
  });

  const [folders, setFolders] = useState([]);
  const [questions, setQuestions] = useState([]);

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

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 p-4">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6">
        <h1 className="font-bold text-lg text-amber-800">定期テスト予想問題</h1>
        <button 
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-full text-sm"
        >
          <span>{userProfile?.avatar || '🎓'}</span>
          <span>{userProfile?.name || 'テスト対策生'}</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="font-bold text-base mb-2">予想問題一覧</h2>
          {questions.length === 0 ? (
            <p className="text-sm text-stone-500">まだ問題が投稿されていません。</p>
          ) : (
            <div className="space-y-2">
              {questions.map(q => (
                <div key={q.id} className="p-3 border rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">{q.title}</p>
                    <p className="text-xs text-stone-400">投稿者: {q.author || '名無しユーザー'}</p>
                  </div>
                  <button 
                    onClick={() => handleToggleLike(q.id)}
                    className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200"
                  >
                    👍 {q.likes || 0}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-bold">プロフィール設定</h3>
            <input 
              type="text" 
              value={userProfile?.name || ''} 
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              className="w-full border p-2 rounded-xl text-sm"
            />
            <button 
              onClick={() => setShowProfileModal(false)}
              className="w-full bg-amber-600 text-white py-2 rounded-xl text-xs font-bold"
            >
              保存する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
