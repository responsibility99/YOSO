import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, FolderPlus, ThumbsUp, 
  Home, PlusCircle, ArrowLeft, Trash2, Calendar, Sparkles,
  MessageCircle, Send, Trophy, Medal, Flame, KeyRound, LogOut,
  ImagePlus, X, HelpCircle, Edit, QrCode, Share2, Target, PartyPopper,
  ArrowUpDown, History, ShieldCheck, Plus, Edit2, Layers, CheckCircle2, XCircle,
  Menu, Users, UserX, Filter, MoreHorizontal
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, query, orderBy
} from 'firebase/firestore';
import './index.css';

// 管理者モード解除用の秘密のパスワード
const ADMIN_PASSWORD = 'admin123';

const SUBJECTS = [
  'すべて', '国語1', '国語２a', '国語２ｂ', '歴史', '地理', 
  '数学Ａ', '数学Ｂ', '化学', '生物', '地学', 
  '音楽', '英語１', '英語２'
];

const BADGES = [
  { id: 'p1', icon: '🌱', name: '初投稿', desc: '問題を1回投稿', type: 'totalPosts', req: 1 },
  { id: 'p2', icon: '🛠️', name: '問題職人', desc: '問題を5回投稿', type: 'totalPosts', req: 5 },
  { id: 'c1', icon: '👋', name: '初めまして', desc: 'チャット1回送信', type: 'totalChats', req: 1 },
  { id: 'c2', icon: '💬', name: 'おしゃべり', desc: 'チャット10回送信', type: 'totalChats', req: 10 },
  { id: 'l1', icon: '🥉', name: 'ルーキー', desc: 'レベル5到達', type: 'level', req: 5 },
  { id: 'l2', icon: '🥈', name: 'チャレンジャー', desc: 'レベル10到達', type: 'level', req: 10 },
  { id: 'h1', icon: '🎯', name: '神予想屋', desc: '的中した問題がある', type: 'hitCount', req: 1 },
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
      xp: 0, level: 1, totalPosts: 0, totalChats: 0, hitCount: 0, secretCode: '', banned: false
    };
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [tempCode, setTempCode] = useState('');

  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [historyList, setHistoryList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [hitAnnouncement, setHitAnnouncement] = useState(null);

  // ユーザーのBAN状態/グループ所属判定のリアルタイム監視
  useEffect(() => {
    if (!userProfile.uid || !userProfile.secretCode) return;
    const unsub = onSnapshot(doc(db, 'users', userProfile.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.banned) {
          alert('管理者によってグループから追放（BAN）されました。');
          setUserProfile(prev => ({ ...prev, secretCode: '', banned: true }));
        }
      }
    });
    return () => unsub();
  }, [userProfile.uid, userProfile.secretCode]);

  useEffect(() => {
    if (!userProfile.secretCode || userProfile.banned) return;
    const unsub = onSnapshot(collection(db, 'folders'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(data.filter(d => d.secretCode === userProfile.secretCode));
    });
    return () => unsub();
  }, [userProfile.secretCode, userProfile.banned]);

  useEffect(() => {
    if (!userProfile.secretCode || userProfile.banned) return;
    const unsub = onSnapshot(collection(db, 'questions'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const groupQuestions = data.filter(d => d.secretCode === userProfile.secretCode);
      setQuestions(groupQuestions);

      const recentlyHit = groupQuestions.find(q => q.lastHitAt && (Date.now() - q.lastHitAt < 10000));
      if (recentlyHit) {
        setHitAnnouncement({
          author: recentlyHit.author,
          subject: recentlyHit.subject,
          questionText: recentlyHit.subQuestions?.[0]?.question || '予想問題'
        });
      }
    });
    return () => unsub();
  }, [userProfile.secretCode, userProfile.banned]);

  useEffect(() => {
    if (!userProfile.secretCode || userProfile.banned) return;
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeaderboard(data.filter(d => d.secretCode === userProfile.secretCode));
    });
    return () => unsub();
  }, [userProfile.secretCode, userProfile.banned]);

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
    
    if (userProfile.uid && userProfile.secretCode && !userProfile.banned) {
      const userRef = doc(db, 'users', userProfile.uid);
      setDoc(userRef, userProfile, { merge: true }).catch(e => console.error(e));
    }
  }, [userProfile]);

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

  const handleToggleHit = async (qId) => {
    const q = questions.find(item => item.id === qId);
    if (!q) return;

    const hitBy = q.hitBy || [];
    const isAlreadyHit = hitBy.includes(userProfile.uid);
    const newHitBy = isAlreadyHit ? hitBy.filter(id => id !== userProfile.uid) : [...hitBy, userProfile.uid];

    try {
      await updateDoc(doc(db, 'questions', qId), {
        hitCount: newHitBy.length,
        hitBy: newHitBy,
        lastHitAt: isAlreadyHit ? null : Date.now()
      });

      if (!isAlreadyHit) gainXP(15, null);
    } catch (err) {}
  };

  const handleKickUser = async (targetUid, targetName) => {
    if (!isAdmin) return;
    if (window.confirm(`「${targetName}」さんをグループからキック（追放）しますか？`)) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          secretCode: '',
          banned: true
        });
        alert(`${targetName} さんを追放しました。`);
      } catch (err) {
        alert('追放処理に失敗しました。');
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

  const handleUnlockAdminPrompt = () => {
    const pwd = window.prompt('管理者パスワードを入力してください:');
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true);
      alert('管理者権限が有効化されました！メンバーのキックやアプリの歴史編集が可能です。');
    } else if (pwd !== null) {
      alert('パスワードが間違っています。');
    }
  };

  if (!userProfile.secretCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-rose-200 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6 border border-white/50">
          <div className="bg-gradient-to-tr from-amber-400 to-orange-500 w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-2 shadow-lg shadow-orange-500/30">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-stone-800">グループに参加</h1>
          <p className="text-xs font-bold text-stone-500 leading-relaxed">仲間と同じ合言葉を入力して、<br/>専用の学習ルームに入ろう！</p>
          <form onSubmit={(e) => { e.preventDefault(); if(tempCode.trim()) setUserProfile({...userProfile, secretCode: tempCode.trim(), banned: false}); }}>
            <input type="text" required value={tempCode} onChange={e => setTempCode(e.target.value)} placeholder="例: class2a" className="w-full border-2 border-stone-200 focus:border-amber-500 p-4 rounded-2xl text-center text-lg font-black outline-none transition mb-4 shadow-inner" />
            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-500/25 transition transform active:scale-95">ルームに入る</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-stone-800 flex flex-col font-sans pb-24">
      {/* 全員共通：神的中ポップアップ演出 */}
      {hitAnnouncement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-yellow-300 via-orange-400 to-rose-500 p-1 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-bounce">
            <div className="bg-white p-6 rounded-[22px] space-y-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto flex items-center justify-center text-yellow-600 shadow-inner">
                <PartyPopper className="w-10 h-10" />
              </div>
              <div className="inline-block bg-rose-100 text-rose-700 text-xs font-black px-3 py-1 rounded-full">
                🎯 テスト的中報告！
              </div>
              <h2 className="text-xl font-black text-stone-800">
                <span className="text-amber-600">{hitAnnouncement.author}</span> さんの問題が<br/>テストに出ました！🎉
              </h2>
              <div className="bg-amber-50 p-3 rounded-2xl text-xs font-bold text-stone-600 border border-amber-200">
                【{hitAnnouncement.subject}】<br/>
                「{hitAnnouncement.questionText}」
              </div>
              <button 
                onClick={() => setHitAnnouncement(null)} 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-extrabold shadow-lg"
              >
                神予想すぎる！👏
              </button>
            </div>
          </div>
        </div>
      )}

      {showLevelUp && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl font-extrabold text-lg flex items-center gap-2 border-4 border-white">
            <Flame className="w-6 h-6 text-yellow-100" /> レベルアップ！ Lv.{userProfile.level}
          </div>
        </div>
      )}

      {/* スッキリ整理したコンパクト・ヘッダー */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 sticky top-0 z-30 shadow-md rounded-b-2xl px-4 py-2.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); setSelectedFolderId(null); }}>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner"><BookOpen className="w-5 h-5 text-white" /></div>
          <h1 className="font-black text-xl tracking-wider drop-shadow-md">YOSO</h1>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="bg-yellow-300 text-stone-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3 h-3" /> ADMIN
            </span>
          )}
          
          <button onClick={() => setShowProfileModal(true)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/30 shadow-sm transition flex items-center gap-1.5 active:scale-95">
            <span className="bg-yellow-300 text-stone-900 px-1.5 py-0.2 rounded-full text-[10px] font-black">Lv.{userProfile.level}</span>
            <span className="truncate max-w-[80px]">{userProfile.avatar} {userProfile.name}</span>
          </button>

          {/* コンパクトなドロワーメニューボタン */}
          <button onClick={() => setShowMenuDrawer(true)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl backdrop-blur-md border border-white/30 text-white transition active:scale-95">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* スライドイン型サブメニュー（Drawer） */}
      {showMenuDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="bg-white w-72 h-full shadow-2xl p-5 flex flex-col justify-between animate-slide-left">
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="font-black text-lg text-stone-800 flex items-center gap-2">
                  <Menu className="w-5 h-5 text-amber-500"/> メニュー
                </h3>
                <button onClick={() => setShowMenuDrawer(false)} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"><X className="w-6 h-6"/></button>
              </div>

              <div className="space-y-2">
                <button onClick={() => { setShowMenuDrawer(false); setShowQrModal(true); }} className="w-full text-left p-3 rounded-2xl hover:bg-orange-50 text-stone-700 font-extrabold text-sm flex items-center gap-3 transition">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><QrCode className="w-4 h-4"/></div> 招待QRコード
                </button>
                <button onClick={() => { setShowMenuDrawer(false); setShowMembersModal(true); }} className="w-full text-left p-3 rounded-2xl hover:bg-indigo-50 text-stone-700 font-extrabold text-sm flex items-center justify-between transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Users className="w-4 h-4"/></div> メンバー一覧
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded-full">{leaderboard.length}</span>
                </button>
                <button onClick={() => { setShowMenuDrawer(false); setShowHistoryModal(true); }} className="w-full text-left p-3 rounded-2xl hover:bg-purple-50 text-stone-700 font-extrabold text-sm flex items-center gap-3 transition">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><History className="w-4 h-4"/></div> アプリの歴史
                </button>
                <button onClick={() => { setShowMenuDrawer(false); setShowHelpModal(true); }} className="w-full text-left p-3 rounded-2xl hover:bg-amber-50 text-stone-700 font-extrabold text-sm flex items-center gap-3 transition">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><HelpCircle className="w-4 h-4"/></div> 使い方ガイド
                </button>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              {!isAdmin ? (
                <button onClick={handleUnlockAdminPrompt} className="w-full py-2 bg-stone-100 hover:bg-purple-50 text-stone-600 hover:text-purple-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                  🔑 管理者権限を解除
                </button>
              ) : (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-center space-y-1">
                  <p className="text-[11px] font-black text-purple-800 flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/> 管理者モード有効中</p>
                  <p className="text-[10px] text-stone-500">メンバー一覧からユーザーの追放が可能です</p>
                </div>
              )}
              <button onClick={() => { if(window.confirm('グループから退出しますか？')) { setUserProfile({...userProfile, secretCode: ''}); setShowMenuDrawer(false); } }} className="w-full py-2 text-xs font-bold text-rose-500 flex justify-center items-center gap-1 hover:bg-rose-50 rounded-xl">
                <LogOut className="w-4 h-4"/> グループを変更する
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 flex-1 w-full flex flex-col">
        {activeTab === 'home' && !selectedQuestionId && !selectedFolderId && (
          <div onClick={() => setShowProfileModal(true)} className="mb-6 cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 rounded-3xl shadow-xl text-white relative overflow-hidden transform transition hover:scale-[1.01] active:scale-95">
            <div className="absolute top-0 right-0 p-4 opacity-15"><Calendar className="w-28 h-28" /></div>
            <div className="relative z-10">
              <h2 className="text-xs font-extrabold text-white/80 mb-1 tracking-wider">定期テストまであと...</h2>
              {daysUntilTest !== null ? (
                daysUntilTest > 0 ? <div className="text-4xl font-black drop-shadow-lg">{daysUntilTest} <span className="text-lg">日</span></div>
                : daysUntilTest === 0 ? <div className="text-3xl font-black drop-shadow-lg text-yellow-300">今日がテスト！🔥</div>
                : <div className="text-2xl font-black drop-shadow-lg">テストお疲れ様！🎉</div>
              ) : <div className="text-sm font-extrabold underline decoration-pink-300 underline-offset-4 mt-1">タップしてテスト日程を設定！</div>}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-extrabold mb-1"><span>次のレベルまで</span><span>{userProfile.xp % 100} / 100 XP</span></div>
                <div className="w-full bg-black/20 rounded-full h-2.5 p-0.5"><div className="bg-gradient-to-r from-yellow-300 to-amber-300 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(userProfile.xp % 100)}%` }}></div></div>
              </div>
            </div>
          </div>
        )}

        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)} 
            currentUid={userProfile.uid}
            onBack={() => setSelectedQuestionId(null)}
            onDelete={async (qId) => { if(window.confirm('削除しますか？')) { await deleteDoc(doc(db, 'questions', qId)); setSelectedQuestionId(null); } }}
            onUpdate={async (qId, updatedData) => { await updateDoc(doc(db, 'questions', qId), updatedData); }}
            onToggleHit={handleToggleHit}
            onAddComment={async (qId, text) => {
              const q = questions.find(item => item.id === qId);
              await updateDoc(doc(db, 'questions', qId), { comments: [...(q.comments || []), { id: 'c_' + Date.now(), user: userProfile.name, text }] });
              gainXP(5, null);
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && <HomeView folders={folders} questions={questions} onSelectQuestion={setSelectedQuestionId} onOpenFolderModal={() => setShowFolderModal(true)} onToggleLike={handleToggleLike} secretCode={userProfile.secretCode} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onOpenQr={() => setShowQrModal(true)} />}
            {activeTab === 'create' && <CreateQuestionView folders={folders} defaultFolderId={selectedFolderId || (folders[0]?.id || '')} userProfile={userProfile} onSuccess={() => { gainXP(50, 'totalPosts'); setActiveTab('home'); }} />}
            {activeTab === 'chat' && <ChatView userProfile={userProfile} onMessageSent={() => gainXP(10, 'totalChats')} />}
            {activeTab === 'ranking' && <RankingView leaderboard={leaderboard} currentUid={userProfile.uid} isAdmin={isAdmin} onKickUser={handleKickUser} onOpenMembers={() => setShowMembersModal(true)} />}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-2 z-30 flex justify-around shadow-[0_-4px_15px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <NavButton active={activeTab === 'home'} icon={<Home className="w-6 h-6" />} label="ホーム" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'create'} icon={<PlusCircle className="w-6 h-6" />} label="投稿" onClick={() => { setActiveTab('create'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'chat'} icon={<MessageCircle className="w-6 h-6" />} label="チャット" onClick={() => { setActiveTab('chat'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'ranking'} icon={<Trophy className="w-6 h-6" />} label="ランキング" onClick={() => { setActiveTab('ranking'); setSelectedQuestionId(null); }} />
      </nav>

      {/* メンバー一覧・荒らし追放モーダル */}
      {showMembersModal && (
        <MembersModal 
          members={leaderboard} 
          currentUid={userProfile.uid}
          isAdmin={isAdmin} 
          onClose={() => setShowMembersModal(false)} 
          onKick={handleKickUser}
          onUnlockAdmin={handleUnlockAdminPrompt}
        />
      )}

      {/* アプリの歴史モーダル */}
      {showHistoryModal && (
        <HistoryModal 
          historyList={historyList} 
          isAdmin={isAdmin} 
          onClose={() => setShowHistoryModal(false)} 
          onUnlockAdmin={handleUnlockAdminPrompt}
        />
      )}

      {/* QRコード招待モーダル */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4">
            <h3 className="font-extrabold text-lg text-amber-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-500" /> グループに友達を招待
            </h3>
            <p className="text-xs font-bold text-stone-500">カメラで読み取って同じ合言葉で参加しよう！</p>
            
            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 shadow-inner my-2 flex items-center justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(userProfile.secretCode)}`} 
                alt="招待QRコード" 
                className="w-44 h-44 rounded-lg shadow-sm"
              />
            </div>

            <div className="bg-stone-100 px-4 py-2 rounded-xl text-sm font-extrabold text-stone-700 w-full flex items-center justify-between">
              <span className="text-stone-400 text-xs">合言葉:</span>
              <span className="text-amber-600 font-black text-base">{userProfile.secretCode}</span>
            </div>

            <div className="w-full pt-2 flex gap-2">
              <button onClick={() => { navigator.clipboard?.writeText(userProfile.secretCode); alert('合言葉をコピーしました！'); }} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1">
                <Share2 className="w-4 h-4" /> 合言葉コピー
              </button>
              <button onClick={() => setShowQrModal(false)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl text-xs font-extrabold shadow-md">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘルプモーダル */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col max-h-[85vh]">
            <h3 className="font-extrabold text-xl text-center text-amber-900 border-b pb-3 mb-4 flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6" /> 使い方ガイド
            </h3>
            <div className="overflow-y-auto pr-2 space-y-4 flex-1 text-sm font-bold text-stone-700">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-amber-800 font-extrabold mb-1">🔑 グループ（合言葉）</h4>
                <p className="text-xs">同じ合言葉を入力した人同士で問題やチャットが共有されます。右上のメニューから招待QRコードを表示できます。</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <h4 className="text-indigo-800 font-extrabold mb-1">🎴 暗記カード（単語帳）</h4>
                <p className="text-xs">問題一覧の「🎴 単語帳」から、教科やフォルダを絞り込んで復習カードを作成できます。</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <h4 className="text-rose-800 font-extrabold mb-1">🎯 テスト的中（神予想！）</h4>
                <p className="text-xs">テスト後に実際に問題が出たら詳細画面の「🎯 出た！」を押そう！押すと投稿者が全員の画面で祝福されます。</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t">
              <button onClick={() => setShowHelpModal(false)} className="w-full bg-amber-500 text-white py-3 rounded-xl text-sm font-extrabold shadow-lg">閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* プロフィールモーダル */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col max-h-[85vh]">
            <h3 className="font-extrabold text-xl text-center text-amber-900 border-b pb-3 mb-4">マイプロフィール</h3>
            <div className="overflow-y-auto pr-2 space-y-5 flex-1">
              <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <div className="text-4xl">{userProfile.avatar}</div>
                <div>
                  <div className="font-extrabold text-lg text-stone-800">{userProfile.name}</div>
                  <div className="text-sm font-bold text-amber-600 flex items-center gap-1"><Medal className="w-4 h-4" /> レベル {userProfile.level} ({userProfile.xp} XP)</div>
                </div>
              </div>
              <div className="space-y-3">
                <div><label className="text-xs font-bold text-stone-500 mb-1 block">ニックネーム</label><input type="text" value={userProfile.name} onChange={e => setUserProfile({ ...userProfile, name: e.target.value })} className="w-full bg-stone-50 border-2 border-stone-200 p-2.5 rounded-xl text-sm outline-none font-bold" /></div>
                <div><label className="text-xs font-bold text-stone-500 mb-1 block">アイコン (絵文字)</label><input type="text" value={userProfile.avatar} onChange={e => setUserProfile({ ...userProfile, avatar: e.target.value })} className="w-full bg-stone-50 border-2 border-stone-200 p-2.5 rounded-xl text-sm outline-none font-bold" /></div>
                <div><label className="text-xs font-bold text-stone-500 mb-1 block">テスト日程</label><input type="date" value={userProfile.testDate} onChange={e => setUserProfile({ ...userProfile, testDate: e.target.value })} className="w-full bg-stone-50 border-2 border-stone-200 p-2.5 rounded-xl text-sm outline-none font-bold text-indigo-700" /></div>
              </div>
              <div className="pt-2">
                <h4 className="font-extrabold text-sm text-stone-700 mb-2 flex items-center gap-1"><Trophy className="w-4 h-4 text-yellow-500" /> 獲得したバッジ ({earnedBadges.length}/{BADGES.length})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {BADGES.map(b => (
                    <div key={b.id} className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border-2 ${((userProfile[b.type] || 0) >= b.req) ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-stone-50 border-stone-100 opacity-40 grayscale'}`}>
                      <div className="text-2xl mb-1">{b.icon}</div><div className="text-[9px] font-extrabold text-stone-700 leading-tight">{b.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t flex flex-col gap-2">
              <button onClick={() => setShowProfileModal(false)} className="w-full bg-amber-500 text-white py-3 rounded-xl text-sm font-extrabold shadow-lg">保存して閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* フォルダ作成モーダル */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-white p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-amber-900">新規フォルダ作成</h3>
            <input type="text" required value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="フォルダ名" className="w-full border-2 border-stone-200 p-3 rounded-xl text-sm outline-none font-bold" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-sm font-bold text-stone-500">キャンセル</button><button type="submit" className="bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-bold">作成</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

// 教科・フォルダで絞り込める暗記カード（単語帳）モードコンポーネント
function FlashcardView({ questions, folders, onBack }) {
  const [selectedSubject, setSelectedSubject] = useState('すべて');
  const [selectedFolderId, setSelectedFolderId] = useState('すべて');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [learnedMap, setLearnedMap] = useState({});

  // 絞り込み処理
  const filteredQuestions = questions.filter(q => {
    const matchSubject = selectedSubject === 'すべて' || q.subject === selectedSubject;
    const matchFolder = selectedFolderId === 'すべて' || q.folderId === selectedFolderId;
    return matchSubject && matchFolder;
  });

  const total = filteredQuestions.length;
  const currentQ = filteredQuestions[currentIndex];

  const handleNext = () => {
    if (total === 0) return;
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    if (total === 0) return;
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const markLearned = (isLearned) => {
    if (!currentQ) return;
    setLearnedMap({ ...learnedMap, [currentQ.id]: isLearned });
    handleNext();
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-extrabold text-stone-600 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-stone-50">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>
        <span className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
          <Layers className="w-3.5 h-3.5"/> 暗記カード ({total === 0 ? 0 : currentIndex + 1} / {total})
        </span>
      </div>

      {/* 絞り込みコントロールパネル */}
      <div className="bg-white p-3.5 rounded-2xl border shadow-sm space-y-2">
        <div className="text-[11px] font-black text-stone-500 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-amber-500" /> 出題範囲を指定
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-stone-400 block mb-0.5">教科</label>
            <select 
              value={selectedSubject} 
              onChange={e => { setSelectedSubject(e.target.value); setCurrentIndex(0); setShowAnswer(false); }}
              className="w-full bg-stone-50 border border-stone-200 p-2 rounded-xl text-xs font-bold outline-none"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-400 block mb-0.5">フォルダ</label>
            <select 
              value={selectedFolderId} 
              onChange={e => { setSelectedFolderId(e.target.value); setCurrentIndex(0); setShowAnswer(false); }}
              className="w-full bg-stone-50 border border-stone-200 p-2 rounded-xl text-xs font-bold outline-none truncate"
            >
              <option value="すべて">すべてのフォルダ</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center space-y-2 shadow-sm border border-dashed border-stone-300">
          <p className="text-stone-400 font-bold text-sm">指定した条件に一致する問題がありません 💬</p>
          <p className="text-stone-400 text-xs">教科やフォルダの絞り込みを変更してみてください</p>
        </div>
      ) : (
        <>
          {/* プログレスバー */}
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-2 transition-all duration-300" style={{ width: `${((currentIndex + 1) / total) * 100}%` }}></div>
          </div>

          {/* フリップ暗記カード */}
          <div 
            onClick={() => setShowAnswer(!showAnswer)}
            className="bg-white min-h-[260px] p-6 rounded-3xl border-2 border-amber-200 shadow-xl flex flex-col justify-between cursor-pointer transform transition active:scale-98 relative overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">{currentQ.subject}</span>
              {learnedMap[currentQ.id] === true && <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> 覚えた</span>}
              {learnedMap[currentQ.id] === false && <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5"/> もう一回</span>}
            </div>

            <div className="my-6 text-center space-y-3">
              <p className="text-xs font-bold text-amber-600 tracking-wider">
                {showAnswer ? '【 解答 】' : '【 問題（タップで答えを表示） 】'}
              </p>
              <div className="text-lg font-black text-stone-800 leading-relaxed">
                {showAnswer ? (
                  <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 inline-block">
                    {currentQ.subQuestions?.[0]?.answer || '解答なし'}
                  </span>
                ) : (
                  <span>{currentQ.subQuestions?.[0]?.question || '無題'}</span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-center font-bold text-stone-400">
              💡 カードをタップして裏返す
            </p>
          </div>

          {/* 操作アクションボタン */}
          <div className="flex gap-2">
            <button onClick={() => markLearned(false)} className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1 transition">
              <XCircle className="w-4 h-4"/> もう一回
            </button>
            <button onClick={() => markLearned(true)} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1 transition">
              <CheckCircle2 className="w-4 h-4"/> 覚えた！
            </button>
          </div>

          <div className="flex justify-between gap-2 pt-1">
            <button onClick={handlePrev} className="flex-1 bg-white border border-stone-200 text-stone-600 py-2.5 rounded-xl font-bold text-xs shadow-sm">
              ◀ 前の問題
            </button>
            <button onClick={handleNext} className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">
              次の問題 ▶
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ホーム表示コンポーネント
function HomeView({ folders, questions, onSelectQuestion, onOpenFolderModal, onToggleLike, secretCode, selectedFolderId, onSelectFolder, onOpenQr }) {
  const [sortBy, setSortBy] = useState('newest');
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);

  let rawQuestions = selectedFolderId ? questions.filter(q => q.folderId === selectedFolderId) : questions;
  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const displayQuestions = [...rawQuestions].sort((a, b) => {
    if (sortBy === 'hit') return (b.hitCount || 0) - (a.hitCount || 0);
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'comments') return (b.comments?.length || 0) - (a.comments?.length || 0);
    return 0;
  });

  if (isFlashcardMode) {
    return <FlashcardView questions={questions} folders={folders} onBack={() => setIsFlashcardMode(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200/80 p-3 rounded-2xl flex items-center justify-between text-xs font-black text-orange-900 shadow-sm">
        <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-orange-600"/> ルーム合言葉: <span className="bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-orange-200">{secretCode}</span></div>
        <button onClick={onOpenQr} className="bg-white text-orange-700 px-3 py-1 rounded-xl border border-orange-200 hover:bg-orange-50 transition flex items-center gap-1 shadow-sm">
          <QrCode className="w-3.5 h-3.5 text-orange-500" /> 招待
        </button>
      </div>
      
      {!selectedFolderId ? (
        <div>
          <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-extrabold text-stone-700 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-amber-500" /> フォルダ</h2><button onClick={onOpenFolderModal} className="text-xs text-orange-700 font-extrabold bg-orange-100 px-4 py-2 rounded-full hover:bg-orange-200 transition">＋ 作成</button></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {folders.map(f => (
              <div key={f.id} onClick={() => onSelectFolder(f.id)} className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:-translate-y-1 transition hover:shadow-md">
                <FolderPlus className="w-8 h-8 text-amber-400 mb-2" />
                <h3 className="font-extrabold text-sm text-stone-700 truncate">{f.name}</h3>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
           <button onClick={() => onSelectFolder(null)} className="flex items-center gap-1 text-sm font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full hover:bg-stone-200 transition"><ArrowLeft className="w-4 h-4" /> 戻る</button>
           <h2 className="text-lg font-extrabold text-stone-800 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-amber-500"/> {selectedFolder?.name}</h2>
        </div>
      )}

      <div>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-lg font-extrabold text-stone-700 flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-400" /> {selectedFolderId ? 'フォルダ内の問題' : 'すべての予想問題'}</h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFlashcardMode(true)} 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 transition transform active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" /> 🎴 単語帳モード
            </button>

            <div className="flex items-center gap-1 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs font-extrabold text-stone-700 bg-transparent outline-none cursor-pointer">
                <option value="newest">新着順</option>
                <option value="hit">🎯 的中順</option>
                <option value="likes">👍 いいね順</option>
                <option value="comments">💬 コメント順</option>
              </select>
            </div>
          </div>
        </div>

        {displayQuestions.length === 0 ? (
          <div className="text-center py-8 text-stone-400 font-bold text-sm bg-white rounded-3xl border border-dashed">問題がありません</div>
        ) : (
          <div className="space-y-4">
            {displayQuestions.map(q => (
              <div key={q.id} onClick={() => onSelectQuestion(q.id)} className="bg-white p-5 rounded-3xl border shadow-md hover:shadow-lg transition cursor-pointer relative overflow-hidden">
                {q.hitCount > 0 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-500 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                    <Target className="w-3 h-3"/> 🎯 的中 {q.hitCount}人
                  </div>
                )}
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">{q.subject}</span>
                <h3 className="font-extrabold text-lg text-stone-800 mt-2 truncate">{q.subQuestions?.[0]?.question || '無題の問題'}</h3>
                <div className="flex justify-between items-center text-xs border-t pt-3 mt-3">
                  <span className="font-bold text-stone-400">作成: {q.author}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-400 font-bold flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5"/> {q.comments?.length || 0}</span>
                    <button onClick={(e) => { e.stopPropagation(); onToggleLike(q.id); }} className={`flex items-center gap-1.5 font-extrabold px-3 py-1.5 rounded-full ${q.likedByMe ? 'bg-rose-100 text-rose-600' : 'bg-stone-50 text-stone-500'}`}><ThumbsUp className="w-4 h-4" /> {q.likes || 0}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// メンバー一覧・管理者追放モーダル
function MembersModal({ members, currentUid, isAdmin, onClose, onKick, onUnlockAdmin }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="font-extrabold text-xl text-stone-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> グループメンバー ({members.length}人)
          </h3>
          {isAdmin && (
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3"/> 管理者権限
            </span>
          )}
        </div>

        <div className="overflow-y-auto pr-1 space-y-2.5 flex-1">
          {members.map((m) => (
            <div key={m.uid} className={`flex items-center justify-between p-3 rounded-2xl border ${m.uid === currentUid ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-100'}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{m.avatar || '🎓'}</div>
                <div>
                  <div className="font-extrabold text-sm text-stone-800 flex items-center gap-1.5">
                    {m.name}
                    {m.uid === currentUid && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">あなた</span>}
                  </div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center gap-2">
                    <span>Lv.{m.level || 1}</span>
                    <span>• {m.xp || 0} XP</span>
                  </div>
                </div>
              </div>

              {/* 管理者用キックボタン */}
              {isAdmin && m.uid !== currentUid && (
                <button 
                  onClick={() => onKick(m.uid, m.name)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95"
                >
                  <UserX className="w-3.5 h-3.5"/> 追放
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
          {!isAdmin ? (
            <button onClick={onUnlockAdmin} className="text-[10px] font-bold text-stone-400 hover:text-purple-600 underline">
              🔑 管理者ログイン
            </button>
          ) : <span className="text-[10px] font-bold text-purple-600">※ 荒らしは「追放」で削除可能</span>}
          <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-extrabold shadow-md">閉じる</button>
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ historyList, isAdmin, onClose, onUnlockAdmin }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [version, setVersion] = useState('');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setVersion(item.version || '');
    setDate(item.date || '');
    setTitle(item.title || '');
    setDesc(item.desc || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setVersion('');
    setDate('');
    setTitle('');
    setDesc('');
  };

  const handleAddHistory = async (e) => {
    e.preventDefault();
    if (!version || !title) return;
    try {
      await addDoc(collection(db, 'app_history'), {
        version, date, title, desc, order: Date.now()
      });
      cancelEdit();
      setShowAddForm(false);
    } catch (err) { alert('追加に失敗しました'); }
  };

  const handleUpdateHistory = async (id) => {
    try {
      await updateDoc(doc(db, 'app_history', id), {
        version, date, title, desc
      });
      cancelEdit();
    } catch (err) { alert('更新に失敗しました'); }
  };

  const handleDeleteHistory = async (id) => {
    if (window.confirm('この歴史項目を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'app_history', id));
      } catch (err) { alert('削除に失敗しました'); }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="font-extrabold text-xl text-purple-900 flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" /> アプリの歴史
          </h3>
          {isAdmin && <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> 管理者</span>}
        </div>

        <div className="overflow-y-auto pr-2 space-y-4 flex-1">
          {isAdmin && !editingId && (
            <button onClick={() => { setShowAddForm(!showAddForm); cancelEdit(); }} className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-2 rounded-xl text-xs font-extrabold border border-purple-200 flex items-center justify-center gap-1 transition">
              <Plus className="w-4 h-4"/> {showAddForm ? 'フォームを閉じる' : '新しい歴史を追加'}
            </button>
          )}

          {showAddForm && !editingId && (
            <form onSubmit={handleAddHistory} className="bg-purple-50 p-3 rounded-2xl space-y-2 border border-purple-200 text-xs font-bold">
              <input type="text" placeholder="バージョン (例: v3.0)" required value={version} onChange={e => setVersion(e.target.value)} className="w-full p-2 border rounded-lg bg-white outline-none" />
              <input type="text" placeholder="日付 (例: 2026/02)" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white outline-none" />
              <input type="text" placeholder="タイトル" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-lg bg-white outline-none" />
              <textarea placeholder="詳細説明" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 border rounded-lg bg-white outline-none" rows="2" />
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg font-extrabold shadow-md">投稿</button>
            </form>
          )}

          {historyList.length === 0 ? (
            <p className="text-center text-xs font-bold text-stone-400 py-6">歴史データがまだありません</p>
          ) : (
            historyList.map((item) => (
              <div key={item.id} className="relative pl-6 border-l-2 border-purple-200 pb-2 group">
                <div className="absolute -left-2 top-0 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-white"></div>
                
                {editingId === item.id ? (
                  <div className="bg-purple-50 p-3 rounded-2xl space-y-2 border border-purple-200 text-xs font-bold">
                    <input type="text" value={version} onChange={e => setVersion(e.target.value)} className="w-full p-2 border rounded-lg bg-white" placeholder="バージョン" />
                    <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white" placeholder="日付" />
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-lg bg-white" placeholder="タイトル" />
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 border rounded-lg bg-white" rows="2" placeholder="詳細説明" />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleUpdateHistory(item.id)} className="flex-1 bg-purple-600 text-white py-1.5 rounded-lg font-extrabold">保存</button>
                      <button onClick={cancelEdit} className="flex-1 bg-stone-200 text-stone-600 py-1.5 rounded-lg font-extrabold">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs font-black text-purple-600 mb-1">
                      <span>{item.version}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 font-bold">{item.date}</span>
                        {isAdmin && (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => startEdit(item)} className="text-purple-600 hover:text-purple-800">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteHistory(item.id)} className="text-rose-500 hover:text-rose-700">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="font-extrabold text-sm text-stone-800 mb-1">{item.title}</h4>
                    <p className="text-xs text-stone-500 font-bold">{item.desc}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
          {!isAdmin ? (
            <button onClick={onUnlockAdmin} className="text-[10px] font-bold text-stone-400 hover:text-purple-600 underline">
              🔑 管理者
            </button>
          ) : <span className="text-[10px] font-bold text-purple-600">管理者モード中</span>}
          <button onClick={onClose} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-extrabold shadow-lg">閉じる</button>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${active ? 'bg-amber-100 text-amber-700 font-extrabold shadow-inner' : 'text-stone-400 hover:bg-stone-50'}`}>
      <div className={`${active ? 'transform scale-110 mb-0.5' : 'mb-1'} transition-transform`}>{icon}</div>
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

function RankingView({ leaderboard, currentUid, isAdmin, onKickUser, onOpenMembers }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-stone-700 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> グループランキング</h2>
        <button onClick={onOpenMembers} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs px-3 py-1.5 rounded-full border border-indigo-200 flex items-center gap-1">
          <Users className="w-3.5 h-3.5"/> メンバー一覧 ({leaderboard.length})
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-lg border border-amber-100 space-y-3">
        {leaderboard.length === 0 && <p className="text-stone-400 text-sm font-bold text-center py-4">データがありません</p>}
        {leaderboard.map((user, index) => (
          <div key={user.uid} className={`flex items-center justify-between p-3 rounded-2xl border-2 ${index===0?'bg-yellow-100 border-yellow-300':index===1?'bg-gray-100 border-gray-300':index===2?'bg-orange-100 border-orange-300':'bg-stone-50 border-stone-100'} ${user.uid===currentUid ? 'ring-2 ring-amber-400' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 font-extrabold text-lg text-center">{index + 1}</div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">{user.avatar || '🎓'}</div>
              <div>
                <div className="font-extrabold text-sm">{user.name} {user.uid===currentUid && <span className="text-[10px] bg-amber-500 text-white px-2 rounded-full">あなた</span>}</div>
                <div className="text-xs font-bold text-amber-600">Lv. {user.level || 1}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="font-extrabold text-sm">{user.xp || 0} XP</div>
              {isAdmin && user.uid !== currentUid && (
                <button onClick={() => onKickUser(user.uid, user.name)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 p-1.5 rounded-lg text-xs font-bold"><UserX className="w-4 h-4"/></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatView({ userProfile, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!userProfile.secretCode) return;
    const unsub = onSnapshot(collection(db, 'chats'), (snapshot) => {
      let msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.secretCode === userProfile.secretCode);
      msgs.sort((a, b) => (a.createdAt?.toMillis?.() || Date.now()) - (b.createdAt?.toMillis?.() || Date.now()));
      setMessages(msgs);
    });
    return () => unsub();
  }, [userProfile.secretCode]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !previewUrl) return;
    try {
      await addDoc(collection(db, 'chats'), { 
        text: newMessage, 
        imageUrl: previewUrl || null,
        user: userProfile.name, 
        avatar: userProfile.avatar, 
        uid: userProfile.uid, 
        secretCode: userProfile.secretCode, 
        createdAt: serverTimestamp() 
      });
      setNewMessage('');
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onMessageSent();
    } catch (err) { alert('送信に失敗しました'); }
  };

  const handleDelete = async (msgId) => {
    if (window.confirm('送信を取り消しますか？')) {
      try {
        await deleteDoc(doc(db, 'chats', msgId));
      } catch (err) { alert('削除に失敗しました'); }
    }
  };

  return (
    <div className="flex flex-col flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      <h2 className="text-xl font-extrabold text-stone-700 flex items-center gap-2 mb-3"><MessageCircle className="w-6 h-6 text-amber-500" /> グループチャット</h2>
      
      <div className="flex-1 bg-stone-50/70 rounded-3xl border border-amber-100 p-4 overflow-y-auto space-y-4 shadow-inner">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.uid === userProfile.uid ? 'flex-row-reverse' : 'flex-row'} group`}>
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border flex-shrink-0">{msg.avatar || '🎓'}</div>
            <div className={`max-w-[75%] flex flex-col ${msg.uid === userProfile.uid ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-stone-400 px-1">{msg.user}</span>
                {msg.uid === userProfile.uid && (
                  <button onClick={() => handleDelete(msg.id)} className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className={`p-3 rounded-2xl text-sm font-bold shadow-sm ${msg.uid === userProfile.uid ? 'bg-amber-400 text-white rounded-tr-sm' : 'bg-white text-stone-700 rounded-tl-sm border'} space-y-2`}>
                {msg.imageUrl && <img src={msg.imageUrl} alt="添付画像" className="rounded-xl max-w-full h-auto border border-black/10" />}
                {msg.text && <div>{msg.text}</div>}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {previewUrl && (
        <div className="mt-3 relative inline-block">
          <div className="bg-stone-200/50 p-2 rounded-2xl border-2 border-dashed border-stone-300 w-32 h-32 flex items-center justify-center overflow-hidden">
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
          </div>
          <button onClick={() => { setPreviewUrl(''); if(fileInputRef.current) fileInputRef.current.value=''; }} className="absolute -top-2 -right-2 bg-stone-700 text-white rounded-full p-1 shadow-md hover:bg-rose-500"><X className="w-4 h-4"/></button>
        </div>
      )}

      <form onSubmit={handleSend} className="mt-3 flex gap-2 items-center bg-white p-2 rounded-3xl shadow-sm border border-stone-200">
        <label className="cursor-pointer text-stone-400 hover:text-amber-500 p-2 transition-colors">
          <ImagePlus className="w-6 h-6" />
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
        </label>
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="発言しよう！" className="flex-1 p-2 text-sm font-bold outline-none bg-transparent" />
        <button type="submit" disabled={!newMessage.trim() && !previewUrl} className="bg-amber-500 disabled:bg-stone-300 text-white p-3 rounded-2xl shadow-md transition-colors"><Send className="w-5 h-5" /></button>
      </form>
    </div>
  );
}

function CreateQuestionView({ folders, defaultFolderId, userProfile, onSuccess }) {
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [subject, setSubject] = useState(SUBJECTS[1]); // 最初のアクティブな教科（'すべて'以外）
  const [subQuestions, setSubQuestions] = useState([{ question: '', answer: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subQuestions[0].question.trim()) return;
    try {
      await addDoc(collection(db, 'questions'), {
        folderId, subject, author: userProfile.name, avatar: userProfile.avatar, uid: userProfile.uid, secretCode: userProfile.secretCode,
        likes: 0, likedByMe: false, hitCount: 0, hitBy: [], subQuestions, comments: [], createdAt: new Date().toLocaleDateString('ja-JP')
      });
      onSuccess();
    } catch (err) { alert('投稿失敗'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl space-y-5 shadow-xl border border-amber-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-extrabold flex items-center gap-2 text-amber-900"><PlusCircle className="w-6 h-6 text-orange-500" /> 問題をつくる <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">+50 XP</span></h2>
      <div className="bg-stone-50 p-4 rounded-2xl space-y-4 border border-stone-100">
        <select value={folderId} onChange={e => setFolderId(e.target.value)} className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{SUBJECTS.filter(s=>s!=='すべて').map(s => <option key={s} value={s}>{s}</option>)}</select>
      </div>
      <div className="space-y-3">
        {subQuestions.map((sq, i) => (
          <div key={i} className="p-4 bg-orange-50 rounded-2xl space-y-2 border relative">
            <div className="absolute top-2 right-2 text-xs font-bold text-orange-300">Q{i+1}</div>
            <input type="text" required value={sq.question} onChange={e => { const newSq = [...subQuestions]; newSq[i].question = e.target.value; setSubQuestions(newSq); }} placeholder="問題を入力" className="w-full border-2 border-orange-100 p-2.5 rounded-xl text-sm font-bold outline-none" />
            <input type="text" required value={sq.answer} onChange={e => { const newSq = [...subQuestions]; newSq[i].answer = e.target.value; setSubQuestions(newSq); }} placeholder="解答を入力" className="w-full border-2 border-rose-100 p-2.5 rounded-xl text-sm font-bold outline-none text-rose-700" />
          </div>
        ))}
        <button type="button" onClick={() => setSubQuestions([...subQuestions, { question: '', answer: '' }])} className="w-full py-3 border-2 border-dashed border-amber-300 text-amber-700 rounded-2xl text-sm font-bold">+ 問題を追加する</button>
      </div>
      <button type="submit" className="w-full bg-gradient-to-r from-orange-400 to-rose-400 text-white py-3.5 rounded-2xl text-base font-extrabold shadow-lg">公開する</button>
    </form>
  );
}

function QuestionDetailView({ question, currentUid, onBack, onDelete, onUpdate, onToggleHit, onAddComment }) {
  const [commentText, setCommentText] = useState('');
  const [showAnswers, setShowAnswers] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [editSubject, setEditSubject] = useState('');
  const [editSubQuestions, setEditSubQuestions] = useState([]);

  useEffect(() => {
    if (question && !isEditing) {
      setEditSubject(question.subject);
      setEditSubQuestions(JSON.parse(JSON.stringify(question.subQuestions || [])));
    }
  }, [question, isEditing]);

  if (!question) return null;

  const isHitByMe = (question.hitBy || []).includes(currentUid);

  const handleSaveEdit = () => {
    onUpdate(question.id, {
      subject: editSubject,
      subQuestions: editSubQuestions
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-3xl space-y-5 shadow-xl border border-amber-100 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-stone-500">キャンセル</button>
          <h2 className="text-lg font-extrabold text-amber-900">問題を編集</h2>
        </div>
        <div className="bg-stone-50 p-4 rounded-2xl space-y-4 border border-stone-100">
          <select value={editSubject} onChange={e => setEditSubject(e.target.value)} className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{SUBJECTS.filter(s=>s!=='すべて').map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div className="space-y-3">
          {editSubQuestions.map((sq, i) => (
            <div key={i} className="p-4 bg-orange-50 rounded-2xl space-y-2 border relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <span className="text-xs font-bold text-orange-300">Q{i+1}</span>
                <button onClick={() => setEditSubQuestions(editSubQuestions.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
              </div>
              <input type="text" value={sq.question} onChange={e => { const newSq = [...editSubQuestions]; newSq[i].question = e.target.value; setEditSubQuestions(newSq); }} placeholder="問題を入力" className="w-full border-2 border-orange-100 p-2.5 rounded-xl text-sm font-bold outline-none" />
              <input type="text" value={sq.answer} onChange={e => { const newSq = [...editSubQuestions]; newSq[i].answer = e.target.value; setEditSubQuestions(newSq); }} placeholder="解答を入力" className="w-full border-2 border-rose-100 p-2.5 rounded-xl text-sm font-bold outline-none text-rose-700" />
            </div>
          ))}
          <button type="button" onClick={() => setEditSubQuestions([...editSubQuestions, { question: '', answer: '' }])} className="w-full py-3 border-2 border-dashed border-amber-300 text-amber-700 rounded-2xl text-sm font-bold">+ 問題を追加する</button>
        </div>
        <button onClick={handleSaveEdit} className="w-full bg-amber-500 text-white py-3.5 rounded-2xl text-base font-extrabold shadow-lg">変更を保存</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-amber-700 bg-white px-3 py-1.5 rounded-full shadow-sm"><ArrowLeft className="w-4 h-4" /> 戻る</button>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-xs font-bold text-stone-600 bg-white border px-3 py-1.5 rounded-full shadow-sm"><Edit className="w-3.5 h-3.5" /> 編集</button>
          <button onClick={() => onDelete(question.id)} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-white border px-3 py-1.5 rounded-full shadow-sm"><Trash2 className="w-3.5 h-3.5" /> 削除</button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 to-rose-300"></div>
        <div className="flex justify-between items-center">
          <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-lg">{question.subject}</div>
          
          <button 
            onClick={() => onToggleHit(question.id)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-md transition transform hover:scale-105 ${isHitByMe ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-amber-100'}`}
          >
            <Target className="w-4 h-4" /> 🎯 テストに出た！ ({question.hitCount || 0})
          </button>
        </div>

        <div className="space-y-3 pt-4">
          {(question.subQuestions || []).map((sq, i) => (
            <div key={i} className="p-4 bg-stone-50 border rounded-2xl shadow-sm">
              <p className="font-extrabold text-sm text-stone-700 mb-3"><span className="text-amber-500 mr-1">Q{i+1}.</span> {sq.question}</p>
              {showAnswers[i] ? (
                <div className="space-y-2">
                  <div className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl border font-extrabold">{sq.answer}</div>
                  <button onClick={() => setShowAnswers(p => ({...p, [i]: false}))} className="text-[11px] text-stone-400 font-bold underline">隠す</button>
                </div>
              ) : <button onClick={() => setShowAnswers(p => ({...p, [i]: true}))} className="w-full py-2.5 bg-amber-100 text-amber-800 rounded-xl text-sm font-extrabold">答えを見る</button>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-lg space-y-4">
        <h3 className="font-extrabold text-base text-stone-700">💬 コメント</h3>
        <div className="flex gap-2">
          <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="コメント (+5 XP)" className="flex-1 bg-stone-50 border-2 p-2.5 rounded-xl text-sm font-bold outline-none" />
          <button onClick={() => { if(commentText) { onAddComment(question.id, commentText); setCommentText(''); } }} className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-extrabold shadow-md">送信</button>
        </div>
        <div className="space-y-2 pt-2">
          {(question.comments || []).map(c => <div key={c.id} className="text-sm bg-stone-50 p-3 rounded-2xl border"><span className="font-extrabold text-amber-700 mr-2">{c.user}</span><span className="font-medium">{c.text}</span></div>)}
        </div>
      </div>
    </div>
  );
}
