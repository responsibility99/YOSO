import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, FolderPlus, ThumbsUp, 
  Home, PlusCircle, ArrowLeft, Trash2, Calendar, Sparkles,
  MessageCircle, Send, Trophy, Medal, Flame, KeyRound, LogOut,
  ImagePlus, X, HelpCircle, Edit
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, query, orderBy
} from 'firebase/firestore';
import './index.css';

const SUBJECTS = [
  '国語1', '国語２a', '国語２ｂ', '歴史', '地理', 
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
      xp: 0, level: 1, totalPosts: 0, totalChats: 0, secretCode: '' 
    };
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [tempCode, setTempCode] = useState('');

  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

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
    
    if (userProfile.uid && userProfile.secretCode) {
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
        <div className="flex items-center gap-2 cursor-pointer text-white" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); setSelectedFolderId(null); }}>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><BookOpen className="w-5 h-5 text-white" /></div>
          <h1 className="font-extrabold text-lg drop-shadow-md">YOSO</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelpModal(true)} className="bg-white/90 hover:bg-white text-amber-600 p-2 rounded-full shadow-md transition transform hover:scale-105">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button onClick={() => setShowProfileModal(true)} className="bg-white/90 hover:bg-white text-stone-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-md transition transform hover:scale-105 flex items-center gap-2">
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">Lv.{userProfile.level}</span>
            <span>{userProfile.avatar} {userProfile.name}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex-1 w-full flex flex-col">
        {activeTab === 'home' && !selectedQuestionId && !selectedFolderId && (
          <div onClick={() => setShowProfileModal(true)} className="mb-6 cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 rounded-3xl shadow-xl text-white relative overflow-hidden transform transition hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Calendar className="w-24 h-24" /></div>
            <div className="relative z-10">
              <h2 className="text-sm font-bold text-white/90 mb-1">定期テストまであと...</h2>
              {daysUntilTest !== null ? (
                daysUntilTest > 0 ? <div className="text-4xl font-extrabold drop-shadow-lg">{daysUntilTest} <span className="text-xl">日</span></div>
                : daysUntilTest === 0 ? <div className="text-4xl font-extrabold drop-shadow-lg text-yellow-300">今日がテスト！🔥</div>
                : <div className="text-2xl font-extrabold drop-shadow-lg">テストお疲れ様！🎉</div>
              ) : <div className="text-lg font-bold underline decoration-pink-300 underline-offset-4 mt-1">ここをタップしてテスト日程を設定！</div>}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold mb-1"><span>次のレベルまで</span><span>{userProfile.xp % 100} / 100 XP</span></div>
                <div className="w-full bg-black/20 rounded-full h-2"><div className="bg-yellow-300 h-2 rounded-full transition-all duration-500" style={{ width: `${(userProfile.xp % 100)}%` }}></div></div>
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
            onAddComment={async (qId, text) => {
              const q = questions.find(item => item.id === qId);
              await updateDoc(doc(db, 'questions', qId), { comments: [...(q.comments || []), { id: 'c_' + Date.now(), user: userProfile.name, text }] });
              gainXP(5, null);
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && <HomeView folders={folders} questions={questions} onSelectQuestion={setSelectedQuestionId} onOpenFolderModal={() => setShowFolderModal(true)} onToggleLike={handleToggleLike} secretCode={userProfile.secretCode} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} />}
            {activeTab === 'create' && <CreateQuestionView folders={folders} defaultFolderId={selectedFolderId || (folders[0]?.id || '')} userProfile={userProfile} onSuccess={() => { gainXP(50, 'totalPosts'); setActiveTab('home'); }} />}
            {activeTab === 'chat' && <ChatView userProfile={userProfile} onMessageSent={() => gainXP(10, 'totalChats')} />}
            {activeTab === 'ranking' && <RankingView leaderboard={leaderboard} currentUid={userProfile.uid} />}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-amber-100 p-2 z-30 flex justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-2xl">
        <NavButton active={activeTab === 'home'} icon={<Home className="w-6 h-6" />} label="ホーム" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'create'} icon={<PlusCircle className="w-6 h-6" />} label="投稿" onClick={() => { setActiveTab('create'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'chat'} icon={<MessageCircle className="w-6 h-6" />} label="チャット" onClick={() => { setActiveTab('chat'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'ranking'} icon={<Trophy className="w-6 h-6" />} label="ランキング" onClick={() => { setActiveTab('ranking'); setSelectedQuestionId(null); }} />
      </nav>

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
                <p className="text-xs">同じ合言葉を入力した人同士で、問題やチャットが共有されます。退出・変更は右上のプロフィールから行えます。</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <h4 className="text-orange-800 font-extrabold mb-1">✍️ 問題の投稿・解答・編集</h4>
                <p className="text-xs">「投稿」タブから予想問題を作れます。投稿した問題は詳細画面の右上のボタンから編集や削除が可能です。</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                <h4 className="text-yellow-800 font-extrabold mb-1">🏆 XPとレベル・バッジ</h4>
                <p className="text-xs">問題を投稿・コメントするとXP（経験値）が貯まりレベルアップ！条件を満たすとバッジも貰えます。</p>
              </div>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <h4 className="text-stone-800 font-extrabold mb-1">💬 チャット機能</h4>
                <p className="text-xs">画像の送信や、自分が送ったメッセージの取り消し（ゴミ箱アイコン）が可能です。</p>
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
              <button onClick={() => { if(window.confirm('グループから退出しますか？')) { setUserProfile({...userProfile, secretCode: ''}); setShowProfileModal(false); } }} className="w-full py-2 text-xs font-bold text-rose-500 flex justify-center items-center gap-1"><LogOut className="w-4 h-4"/> 別の合言葉に変更する</button>
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

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${active ? 'bg-amber-100 text-amber-700 font-extrabold shadow-inner' : 'text-stone-400 hover:bg-stone-50'}`}>
      <div className={`${active ? 'transform scale-110 mb-0.5' : 'mb-1'} transition-transform`}>{icon}</div>
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

function RankingView({ leaderboard, currentUid }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-stone-700 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> グループ内ランキング</h2>
      <div className="bg-white rounded-3xl p-4 shadow-lg border border-amber-100 space-y-3">
        {leaderboard.length === 0 && <p className="text-stone-400 text-sm font-bold text-center py-4">データがありません</p>}
        {leaderboard.map((user, index) => (
          <div key={user.uid} className={`flex items-center justify-between p-3 rounded-2xl border-2 ${index===0?'bg-yellow-100 border-yellow-300':index===1?'bg-gray-100 border-gray-300':index===2?'bg-orange-100 border-orange-300':'bg-stone-50 border-stone-100'} ${user.uid===currentUid ? 'ring-2 ring-amber-400' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 font-extrabold text-lg text-center">{index + 1}</div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">{user.avatar || '🎓'}</div>
              <div><div className="font-extrabold text-sm">{user.name} {user.uid===currentUid && <span className="text-[10px] bg-amber-500 text-white px-2 rounded-full">あなた</span>}</div><div className="text-xs font-bold text-amber-600">Lv. {user.level || 1}</div></div>
            </div>
            <div className="font-extrabold text-sm">{user.xp || 0} XP</div>
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
    <div className="flex flex-col flex-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
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
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [title, setTitle] = useState('');
  const [subQuestions, setSubQuestions] = useState([{ question: '', answer: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await addDoc(collection(db, 'questions'), {
        folderId, subject, title, author: userProfile.name, avatar: userProfile.avatar, uid: userProfile.uid, secretCode: userProfile.secretCode,
        likes: 0, likedByMe: false, subQuestions, comments: [], createdAt: new Date().toLocaleDateString('ja-JP')
      });
      onSuccess();
    } catch (err) { alert('投稿失敗'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl space-y-5 shadow-xl border border-amber-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-extrabold flex items-center gap-2 text-amber-900"><PlusCircle className="w-6 h-6 text-orange-500" /> 問題をつくる <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">+50 XP</span></h2>
      <div className="bg-stone-50 p-4 rounded-2xl space-y-4 border border-stone-100">
        <select value={folderId} onChange={e => setFolderId(e.target.value)} className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="タイトル (例: 中間テスト対策 漢字10問)" className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm font-bold outline-none" />
      </div>
      <div className="space-y-3">
        {subQuestions.map((sq, i) => (
          <div key={i} className="p-4 bg-orange-50 rounded-2xl space-y-2 border relative">
            <div className="absolute top-2 right-2 text-xs font-bold text-orange-300">Q{i+1}</div>
            <input type="text" value={sq.question} onChange={e => { const newSq = [...subQuestions]; newSq[i].question = e.target.value; setSubQuestions(newSq); }} placeholder="問題を入力" className="w-full border-2 border-orange-100 p-2.5 rounded-xl text-sm font-bold outline-none" />
            <input type="text" value={sq.answer} onChange={e => { const newSq = [...subQuestions]; newSq[i].answer = e.target.value; setSubQuestions(newSq); }} placeholder="解答を入力" className="w-full border-2 border-rose-100 p-2.5 rounded-xl text-sm font-bold outline-none text-rose-700" />
          </div>
        ))}
        <button type="button" onClick={() => setSubQuestions([...subQuestions, { question: '', answer: '' }])} className="w-full py-3 border-2 border-dashed border-amber-300 text-amber-700 rounded-2xl text-sm font-bold">+ 問題を追加する</button>
      </div>
      <button type="submit" className="w-full bg-gradient-to-r from-orange-400 to-rose-400 text-white py-3.5 rounded-2xl text-base font-extrabold shadow-lg">公開する</button>
    </form>
  );
}

function QuestionDetailView({ question, currentUid, onBack, onDelete, onUpdate, onAddComment }) {
  const [commentText, setCommentText] = useState('');
  const [showAnswers, setShowAnswers] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSubQuestions, setEditSubQuestions] = useState([]);

  useEffect(() => {
    if (question && !isEditing) {
      setEditTitle(question.title);
      setEditSubject(question.subject);
      setEditSubQuestions(JSON.parse(JSON.stringify(question.subQuestions || [])));
    }
  }, [question, isEditing]);

  if (!question) return null;

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate(question.id, {
      title: editTitle,
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
          <select value={editSubject} onChange={e => setEditSubject(e.target.value)} className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="タイトル" className="w-full border-2 border-stone-200 p-2.5 rounded-xl text-sm font-bold outline-none" />
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
        <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-lg">{question.subject}</div>
        <h2 className="text-2xl font-extrabold text-stone-800">{question.title}</h2>
        <div className="space-y-3 pt-4 border-t">
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

function HomeView({ folders, questions, onSelectQuestion, onOpenFolderModal, onToggleLike, secretCode, selectedFolderId, onSelectFolder }) {
  const displayQuestions = selectedFolderId ? questions.filter(q => q.folderId === selectedFolderId) : questions;
  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="space-y-8">
      <div className="bg-orange-100 border-2 border-orange-200 p-3 rounded-xl flex items-center justify-between text-sm font-extrabold text-orange-800">
        <div className="flex items-center gap-2"><KeyRound className="w-4 h-4"/> 参加中の合言葉: <span className="bg-white px-2 py-0.5 rounded-md">{secretCode}</span></div>
      </div>
      
      {!selectedFolderId ? (
        <div>
          <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-extrabold text-stone-700 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-amber-500" /> フォルダ</h2><button onClick={onOpenFolderModal} className="text-xs text-orange-700 font-extrabold bg-orange-100 px-4 py-2 rounded-full">＋ 作成</button></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {folders.map(f => (
              <div key={f.id} onClick={() => onSelectFolder(f.id)} className="bg-white p-4 rounded-2xl border shadow-md cursor-pointer hover:-translate-y-1 transition">
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
        <h2 className="text-lg font-extrabold text-stone-700 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-400" /> {selectedFolderId ? 'フォルダ内の問題' : 'すべての予想問題'}</h2>
        {displayQuestions.length === 0 ? (
          <div className="text-center py-8 text-stone-400 font-bold text-sm bg-white rounded-3xl border border-dashed">問題がありません</div>
        ) : (
          <div className="space-y-4">
            {displayQuestions.map(q => (
              <div key={q.id} onClick={() => onSelectQuestion(q.id)} className="bg-white p-5 rounded-3xl border shadow-md cursor-pointer">
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">{q.subject}</span>
                <h3 className="font-extrabold text-lg text-stone-800 mt-2">{q.title}</h3>
                <div className="flex justify-between items-center text-xs border-t pt-3 mt-3">
                  <span className="font-bold text-stone-400">作成: {q.author}</span>
                  <button onClick={(e) => { e.stopPropagation(); onToggleLike(q.id); }} className={`flex items-center gap-1.5 font-extrabold px-3 py-1.5 rounded-full ${q.likedByMe ? 'bg-rose-100 text-rose-600' : 'bg-stone-50 text-stone-500'}`}><ThumbsUp className="w-4 h-4" /> {q.likes || 0}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
