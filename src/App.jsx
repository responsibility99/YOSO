import React, { useState, useEffect } from 'react';
import { 
  Home, PlusCircle, MessageCircle, Trophy, LogOut,
  QrCode, HelpCircle, History, Users, Menu, X, Send, BookOpen, Calendar, Plus, Trash2, Edit, ShieldAlert
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, query, orderBy
} from 'firebase/firestore';
import './index.css';

import PvPBattle, { SUBJECTS } from './components/PvPBattle';
import QuestionDetailView, { FlashcardView } from './components/QuestionDetailView';
import UserProfileModal from './components/UserProfileModal';
import FolderAndHitManager from './components/FolderAndHitManager';

const ADMIN_PASSWORD = 'admin123';

const BADGES = [
  { id: 'p1', icon: '🌱', name: '初投稿', desc: '問題を1回投稿', type: 'totalPosts', req: 1 },
  { id: 'p2', icon: '🛠️', name: '問題職人', desc: '問題を5回投稿', type: 'totalPosts', req: 5 },
  { id: 'c1', icon: '👋', name: '初めまして', desc: 'チャット1回送信', type: 'totalChats', req: 1 },
  { id: 'c2', icon: '💬', name: 'おしゃべり', desc: 'チャット10回送信', type: 'totalChats', req: 10 },
  { id: 'l1', icon: '🥉', name: 'ルーキー', desc: 'レベル5到達', type: 'level', req: 5 },
  { id: 'h1', icon: '🎯', name: '神予想屋', desc: '的中した問題がある', type: 'hitCount', req: 1 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [showPvP, setShowPvP] = useState(false);

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('study_app_user_v6');
    const defaultUid = 'user_' + Date.now() + Math.floor(Math.random()*1000);
    return saved ? JSON.parse(saved) : { 
      uid: defaultUid, name: 'チャレンジャー', avatar: '🎓', testDate: '',
      xp: 0, level: 1, totalPosts: 0, totalChats: 0, hitCount: 0, secretCode: ''
    };
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [tempCode, setTempCode] = useState('');

  const [histVersion, setHistVersion] = useState('');
  const [histTitle, setHistTitle] = useState('');
  const [histDesc, setHistDesc] = useState('');
  const [editingHistId, setEditingHistId] = useState(null);

  const [folders, setFolders] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

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
      const groupUsers = data.filter(d => d.secretCode === userProfile.secretCode);
      
      const me = groupUsers.find(u => u.uid === userProfile.uid);
      // 管理者(isAdmin)でない一般ユーザーのみBAN判定を有効化
      if (me && me.isKicked && !isAdmin) {
        alert('管理者によってこのグループから退去処理されました。');
        setUserProfile(prev => ({ ...prev, secretCode: '' }));
      }
      setLeaderboard(groupUsers.slice(0, 30));
    });
    return () => unsub();
  }, [userProfile.secretCode, userProfile.uid, isAdmin]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'app_history'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.order || 0) - (a.order || 0));
      setHistoryList(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('study_app_user_v6', JSON.stringify(userProfile));
    if (userProfile.uid && userProfile.secretCode) {
      setDoc(doc(db, 'users', userProfile.uid), userProfile, { merge: true }).catch(console.error);
    }
  }, [userProfile]);

  const gainXP = (amount, statKey) => {
    setUserProfile(prev => {
      const newXp = (prev.xp || 0) + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      const updates = { xp: newXp, level: newLevel };
      if (statKey) updates[statKey] = (prev[statKey] || 0) + 1;
      return { ...prev, ...updates };
    });
  };

  const handleKickUser = async (targetUid, targetName) => {
    if (!isAdmin) return;
    if (window.confirm(`「${targetName}」をグループから追放（BAN）しますか？`)) {
      try {
        await updateDoc(doc(db, 'users', targetUid), { isKicked: true });
        alert('追放しました');
      } catch (err) {
        alert('追放に失敗しました');
      }
    }
  };

  const handleSaveHistory = async (e) => {
    e.preventDefault();
    if (!histTitle.trim()) return;

    try {
      if (editingHistId) {
        await updateDoc(doc(db, 'app_history', editingHistId), {
          version: histVersion || 'v1.0',
          title: histTitle,
          desc: histDesc
        });
        setEditingHistId(null);
        alert('歴史を更新しました！');
      } else {
        await addDoc(collection(db, 'app_history'), {
          version: histVersion || 'v1.0',
          title: histTitle,
          desc: histDesc,
          date: new Date().toLocaleDateString('ja-JP'),
          order: Date.now()
        });
        alert('新しい歴史を追加しました！');
      }
      setHistVersion('');
      setHistTitle('');
      setHistDesc('');
    } catch (err) {
      alert('保存に失敗しました');
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('この歴史の項目を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'app_history', id));
      } catch (err) {
        alert('削除に失敗しました');
      }
    }
  };

  const getDaysUntilTest = () => {
    if (!userProfile.testDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = new Date(userProfile.testDate) - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilTest();

  if (!userProfile.secretCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-amber-200 shadow-xl max-w-sm w-full text-center space-y-6">
          <div className="bg-gradient-to-tr from-amber-400 to-orange-500 w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-amber-600">YOSO</h1>
          <p className="text-xs font-bold text-stone-600 leading-relaxed">
            同じ合言葉を入力して<br/>仲間と予想問題を共有しよう！
          </p>
          <form onSubmit={(e) => { e.preventDefault(); if(tempCode.trim()) setUserProfile({...userProfile, secretCode: tempCode.trim()}); }}>
            <input 
              type="text" 
              required 
              value={tempCode} 
              onChange={e => setTempCode(e.target.value)} 
              placeholder="例: room2026" 
              className="w-full bg-amber-50/50 border-2 border-amber-200 focus:border-amber-500 p-4 rounded-2xl text-center text-lg font-black outline-none text-stone-800 transition mb-4 shadow-inner" 
            />
            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-amber-500/30 transition">
              ルームに入る
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-orange-50/30 to-amber-100/40 text-stone-800 flex flex-col font-sans pb-24">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-amber-200/60 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); setIsFlashcardMode(false); setShowPvP(false); }}>
          <div className="bg-gradient-to-tr from-amber-400 to-orange-500 p-2 rounded-2xl shadow-sm"><BookOpen className="w-5 h-5 text-white" /></div>
          <h1 className="font-black text-xl tracking-wider bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">YOSO</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfileModal(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-2 shadow-sm transition">
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">Lv.{userProfile.level}</span>
            <span className="truncate max-w-[90px]">{userProfile.avatar} {userProfile.name}</span>
          </button>
          <button onClick={() => setShowMenuDrawer(true)} className="p-2 bg-amber-100 hover:bg-amber-200 rounded-2xl text-amber-900 transition"><Menu className="w-5 h-5" /></button>
        </div>
      </header>

      {/* ドロワー */}
      {showMenuDrawer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-64 h-full p-6 space-y-6 flex flex-col justify-between border-l border-amber-200 shadow-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-amber-100 pb-3">
                <h3 className="font-extrabold text-sm text-stone-700">メニュー</h3>
                <button onClick={() => setShowMenuDrawer(false)} className="text-stone-400 hover:text-stone-700"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-2">
                <button onClick={() => { setShowQrModal(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-orange-600"><QrCode className="w-4 h-4"/> 招待QRを表示</button>
                <button onClick={() => { setShowMemberList(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-indigo-600"><Users className="w-4 h-4"/> メンバー一覧</button>
                <button onClick={() => { setShowHistoryModal(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-purple-600"><History className="w-4 h-4"/> アプリの歴史</button>
                <button onClick={() => { setShowHelpModal(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-amber-600"><HelpCircle className="w-4 h-4"/> 使い方・ルール</button>
              </div>
            </div>
            <button onClick={() => { if(window.confirm('グループから退出しますか？')) { setUserProfile({...userProfile, secretCode: ''}); setShowMenuDrawer(false); } }} className="w-full py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl text-xs font-black flex items-center justify-center gap-1 border border-rose-200"><LogOut className="w-4 h-4"/> 部屋を出る</button>
          </div>
        </div>
      )}

      {/* メインビュー */}
      <main className="max-w-4xl mx-auto p-4 flex-1 w-full space-y-4">
        {daysLeft !== null && !selectedQuestionId && !isFlashcardMode && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-5 rounded-3xl shadow-xl border border-amber-300 relative overflow-hidden flex justify-between items-center px-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-100">
                <Calendar className="w-4 h-4 text-amber-200"/> テスト本番まで
              </div>
              <div className="text-2xl font-black tracking-tight">
                {daysLeft > 0 ? (
                  <span>あと <span className="text-4xl text-yellow-200 font-extrabold">{daysLeft}</span> 日</span>
                ) : daysLeft === 0 ? (
                  <span className="text-2xl text-yellow-200">🔥 今日がテスト本番！</span>
                ) : (
                  <span>テスト終了</span>
                )}
              </div>
            </div>
            <div className="text-5xl opacity-20">🎯</div>
          </div>
        )}

        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)} 
            currentUid={userProfile.uid}
            onBack={() => setSelectedQuestionId(null)}
            onAddComment={async (qId, text) => {
              const q = questions.find(item => item.id === qId);
              await updateDoc(doc(db, 'questions', qId), {
                comments: [...(q.comments || []), { id: 'c_' + Date.now(), user: userProfile.name, text }]
              });
              gainXP(5, null);
            }}
          />
        ) : isFlashcardMode ? (
          <FlashcardView questions={questions} folders={folders} onBack={() => setIsFlashcardMode(false)} />
        ) : (
          <>
            {activeTab === 'home' && (
              <div className="space-y-6">
                {showPvP ? (
                  <div className="space-y-3">
                    <button onClick={() => setShowPvP(false)} className="text-xs font-bold text-amber-600 bg-white border border-amber-200 px-3 py-1 rounded-full shadow-sm">
                      ← 通常モードに戻る
                    </button>
                    <PvPBattle 
                      leaderboard={leaderboard} 
                      currentUid={userProfile.uid} 
                      questions={questions} 
                      userProfile={userProfile} 
                      gainXP={gainXP} 
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-stone-800">📁 フォルダ & 予想問題一覧</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setShowPvP(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm">
                          ⚔️ 対戦モード
                        </button>
                        <button onClick={() => setIsFlashcardMode(true)} className="bg-white border border-amber-300 text-amber-600 px-3 py-1.5 rounded-xl text-xs font-black hover:bg-amber-50 shadow-sm">
                          🎴 暗記カード
                        </button>
                      </div>
                    </div>
                    
                    <FolderAndHitManager 
                      folders={folders}
                      questions={questions}
                      selectedFolderId={selectedFolderId}
                      onSelectFolder={setSelectedFolderId}
                      onSelectQuestion={setSelectedQuestionId}
                      userProfile={userProfile}
                      gainXP={gainXP}
                    />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'create' && <CreateCardView folders={folders} userProfile={userProfile} onSuccess={() => { gainXP(50, 'totalPosts'); setActiveTab('home'); }} />}
            {activeTab === 'chat' && <ChatView userProfile={userProfile} onMessageSent={() => gainXP(10, 'totalChats')} />}
            {activeTab === 'ranking' && <RankingView leaderboard={leaderboard} currentUid={userProfile.uid} />}
          </>
        )}
      </main>

      {/* フッターナビ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-amber-200 p-2 z-30 flex justify-around shadow-lg rounded-t-3xl">
        <NavBtn active={activeTab === 'home'} icon={<Home className="w-6 h-6" />} label="ホーム" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); setIsFlashcardMode(false); setShowPvP(false); }} />
        <NavBtn active={activeTab === 'create'} icon={<PlusCircle className="w-6 h-6" />} label="問題作成" onClick={() => { setActiveTab('create'); setSelectedQuestionId(null); setIsFlashcardMode(false); setShowPvP(false); }} />
        <NavBtn active={activeTab === 'chat'} icon={<MessageCircle className="w-6 h-6" />} label="チャット" onClick={() => { setActiveTab('chat'); setSelectedQuestionId(null); setIsFlashcardMode(false); setShowPvP(false); }} />
        <NavBtn active={activeTab === 'ranking'} icon={<Trophy className="w-6 h-6" />} label="順位" onClick={() => { setActiveTab('ranking'); setSelectedQuestionId(null); setIsFlashcardMode(false); setShowPvP(false); }} />
      </nav>

      {/* モーダル */}
      {showProfileModal && (
        <UserProfileModal 
          userProfile={userProfile} 
          setUserProfile={setUserProfile} 
          badges={BADGES} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}

      {showMemberList && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full border border-amber-200 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center border-b border-amber-100 pb-3 mb-3">
              <h3 className="font-black text-lg text-stone-800 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500"/> 参加メンバー</h3>
              {!isAdmin && (
                <button onClick={() => { const pwd = window.prompt('管理者パスワード:'); if (pwd === ADMIN_PASSWORD) setIsAdmin(true); }} className="text-[10px] text-stone-400 underline font-bold">🔑 管理者</button>
              )}
            </div>
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {leaderboard.map(u => (
                <div key={u.uid} className="bg-amber-50/50 p-3 rounded-2xl flex items-center justify-between border border-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{u.avatar || '🎓'}</span>
                    <div>
                      <div className="text-xs font-extrabold text-stone-800">{u.name}</div>
                      <div className="text-[10px] text-amber-600 font-bold">Lv.{u.level || 1} • {u.xp || 0} XP</div>
                    </div>
                  </div>
                  {isAdmin && u.uid !== userProfile.uid && (
                    <button onClick={() => handleKickUser(u.uid, u.name)} className="text-[10px] font-black bg-rose-500 text-white px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 hover:bg-rose-600 transition">
                      <ShieldAlert className="w-3 h-3"/> 追放
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowMemberList(false)} className="mt-4 w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs">閉じる</button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full border border-amber-200 text-stone-800 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center border-b border-amber-100 pb-3">
              <h3 className="font-black text-base text-purple-600">アプリの歴史</h3>
              {!isAdmin && <button onClick={() => { const pwd = window.prompt('管理者パスワード:'); if (pwd === ADMIN_PASSWORD) setIsAdmin(true); }} className="text-[10px] text-stone-400 underline font-bold">🔑 管理者</button>}
            </div>

            {isAdmin && (
              <form onSubmit={handleSaveHistory} className="bg-purple-50 p-3 rounded-2xl border border-purple-200 space-y-2 text-xs">
                <div className="font-extrabold text-purple-800 flex justify-between items-center">
                  <span>{editingHistId ? '✏️ 歴史の編集' : '＋ 新しい歴史を追加'}</span>
                  {editingHistId && <button type="button" onClick={() => { setEditingHistId(null); setHistVersion(''); setHistTitle(''); setHistDesc(''); }} className="text-[10px] text-rose-500 underline">キャンセル</button>}
                </div>
                <input type="text" placeholder="バージョン (例: v2.1)" value={histVersion} onChange={e => setHistVersion(e.target.value)} className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs outline-none" />
                <input type="text" required placeholder="タイトル" value={histTitle} onChange={e => setHistTitle(e.target.value)} className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs outline-none font-bold" />
                <textarea placeholder="アップデート内容の詳細" value={histDesc} onChange={e => setHistDesc(e.target.value)} className="w-full p-2 bg-white rounded-lg border border-purple-200 text-xs outline-none h-16" />
                <button type="submit" className="w-full bg-purple-600 text-white py-1.5 rounded-lg font-black text-xs shadow-sm">
                  {editingHistId ? '更新を保存' : '歴史に刻む'}
                </button>
              </form>
            )}

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {historyList.map(item => (
                <div key={item.id} className="border-l-2 border-purple-400 pl-3 py-1 space-y-0.5 relative group">
                  <div className="flex justify-between items-center text-[10px] font-black text-purple-600">
                    <span>{item.version} ({item.date})</span>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingHistId(item.id); setHistVersion(item.version || ''); setHistTitle(item.title || ''); setHistDesc(item.desc || ''); }} className="text-indigo-600 font-bold flex items-center gap-0.5"><Edit className="w-3 h-3"/>編集</button>
                        <button onClick={() => handleDeleteHistory(item.id)} className="text-rose-500 font-bold flex items-center gap-0.5"><Trash2 className="w-3 h-3"/>削除</button>
                      </div>
                    )}
                  </div>
                  <h4 className="font-black text-xs text-stone-800">{item.title}</h4>
                  <p className="text-[10px] text-stone-500 font-bold">{item.desc}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="bg-purple-500 hover:bg-purple-600 text-white w-full py-2.5 rounded-xl font-black text-xs shadow-md">閉じる</button>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full border border-amber-200 text-center space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-amber-600 flex items-center justify-center gap-2"><QrCode className="w-5 h-5"/> 招待QR</h3>
            <div className="bg-amber-50 p-4 rounded-2xl inline-block my-2 border border-amber-100"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(userProfile.secretCode)}`} alt="QR" className="w-40 h-40"/></div>
            <div className="bg-amber-100/60 px-4 py-2 rounded-xl text-xs font-extrabold text-stone-700 flex justify-between items-center"><span>合言葉:</span><span className="text-amber-600 text-sm font-black">{userProfile.secretCode}</span></div>
            <button onClick={() => setShowQrModal(false)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-black text-xs shadow-md">閉じる</button>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full border border-amber-200 text-stone-800 shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-center text-amber-600 border-b border-amber-100 pb-3">使い方ガイド</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-bold">1. クラスやグループの予想問題を投稿・整理！<br/>2. 暗記カード機能でサクサクテスト対策。<br/>3. お楽しみ機能として対戦モードも遊べます！</p>
            <button onClick={() => setShowHelpModal(false)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-black text-xs shadow-md">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateCardView({ folders, userProfile, onSuccess }) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [folderId, setFolderId] = useState('');
  const [subQuestions, setSubQuestions] = useState([{ question: '', answer: '' }]);

  const handleAddSub = () => {
    setSubQuestions([...subQuestions, { question: '', answer: '' }]);
  };

  const handleRemoveSub = (index) => {
    if (subQuestions.length === 1) return;
    setSubQuestions(subQuestions.filter((_, i) => i !== index));
  };

  const handleSubChange = (index, field, value) => {
    const updated = [...subQuestions];
    updated[index][field] = value;
    setSubQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subQuestions[0].question.trim()) return;

    try {
      await addDoc(collection(db, 'questions'), {
        subject, folderId, author: userProfile.name, avatar: userProfile.avatar, uid: userProfile.uid, secretCode: userProfile.secretCode,
        subQuestions, comments: [], createdAt: Date.now()
      });
      onSuccess();
    } catch (err) { alert('作成失敗'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl space-y-4 border border-amber-200 max-w-xl mx-auto shadow-lg">
      <h2 className="text-lg font-black text-amber-600 flex items-center gap-2"><PlusCircle className="w-5 h-5"/> 新しい予想問題を投稿</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <select value={subject} onChange={e => setSubject(e.target.value)} className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl text-xs font-bold text-stone-800">
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={folderId} onChange={e => setFolderId(e.target.value)} className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl text-xs font-bold text-stone-800">
          <option value="">フォルダ選択（なし）</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div className="space-y-3 pt-2">
        {subQuestions.map((sub, idx) => (
          <div key={idx} className="p-3 bg-amber-50/40 border border-amber-200 rounded-2xl space-y-2 relative">
            <div className="flex justify-between items-center text-xs font-bold text-amber-800">
              <span>小問 {idx + 1}</span>
              {subQuestions.length > 1 && (
                <button type="button" onClick={() => handleRemoveSub(idx)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4"/></button>
              )}
            </div>
            <input 
              type="text" 
              required 
              value={sub.question} 
              onChange={e => handleSubChange(idx, 'question', e.target.value)} 
              placeholder={`問題 ${idx + 1} を入力...`} 
              className="w-full bg-white border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-amber-400" 
            />
            <input 
              type="text" 
              required 
              value={sub.answer} 
              onChange={e => handleSubChange(idx, 'answer', e.target.value)} 
              placeholder={`解答 ${idx + 1} を入力...`} 
              className="w-full bg-white border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-rose-600 outline-none focus:border-rose-400" 
            />
          </div>
        ))}

        <button 
          type="button" 
          onClick={handleAddSub} 
          className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-black flex items-center justify-center gap-1 border border-amber-200 transition"
        >
          <Plus className="w-4 h-4"/> 小問を追加する
        </button>
      </div>

      <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-xl font-black text-xs shadow-md shadow-amber-500/20">
        投稿する (+50 XP)
      </button>
    </form>
  );
}

function ChatView({ userProfile, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!userProfile.secretCode) return;
    const unsub = onSnapshot(collection(db, 'chats'), (snapshot) => {
      let msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.secretCode === userProfile.secretCode);
      msgs.sort((a, b) => (a.createdAt?.toMillis?.() || Date.now()) - (b.createdAt?.toMillis?.() || Date.now()));
      setMessages(msgs);
    });
    return () => unsub();
  }, [userProfile.secretCode]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'chats'), { text: newMessage, user: userProfile.name, avatar: userProfile.avatar, uid: userProfile.uid, secretCode: userProfile.secretCode, createdAt: serverTimestamp() });
      setNewMessage('');
      onMessageSent();
    } catch (err) {}
  };

  return (
    <div className="flex flex-col space-y-3 h-[calc(100vh-160px)]">
      <h2 className="text-base font-black text-stone-800 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-amber-500"/> チャット</h2>
      <div className="flex-1 bg-white rounded-3xl border border-amber-200 p-4 overflow-y-auto space-y-3 shadow-inner">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.uid === userProfile.uid ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xl">{msg.avatar || '🎓'}</span>
            <div className={`p-3 rounded-2xl text-xs font-bold ${msg.uid === userProfile.uid ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-100/70 text-stone-800'}`}>{msg.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="メッセージを入力..." className="flex-1 bg-white border border-amber-200 p-3 rounded-2xl text-xs font-bold text-stone-800 outline-none focus:border-amber-400 shadow-sm" />
        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-2xl font-black shadow-md"><Send className="w-4 h-4"/></button>
      </form>
    </div>
  );
}

function RankingView({ leaderboard, currentUid }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-stone-800 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500"/> みんなのランキング</h2>
      <div className="space-y-2">
        {leaderboard.map((u, i) => (
          <div key={u.uid} className="bg-white p-3.5 rounded-2xl flex items-center justify-between border border-amber-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-stone-400">{i+1}</span>
              <span className="text-2xl">{u.avatar || '🎓'}</span>
              <div><div className="text-xs font-extrabold text-stone-800">{u.name} {u.uid === currentUid && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-md font-black">あなた</span>}</div><div className="text-[10px] font-bold text-amber-600">Lv.{u.level || 1}</div></div>
            </div>
            <span className="text-xs font-black text-stone-700">{u.xp || 0} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all ${active ? 'bg-amber-100 text-amber-600 font-black' : 'text-stone-400'}`}>
      {icon}<span className="text-[9px] mt-0.5">{label}</span>
    </button>
  );
}
