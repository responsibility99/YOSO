import React, { useState, useEffect } from 'react';
import { 
  Home, PlusCircle, MessageCircle, Trophy, LogOut,
  QrCode, HelpCircle, History, Swords, Users, Menu, X, Send
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, setDoc, query, orderBy
} from 'firebase/firestore';
import './index.css';

// 分割コンポーネントの読み込み（構文エラー修復済み）
import BossBattle, { INITIAL_BOSSES, SUBJECTS } from './components/BossBattle';
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

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('study_app_user_v6');
    const defaultUid = 'user_' + Date.now() + Math.floor(Math.random()*1000);
    return saved ? JSON.parse(saved) : { 
      uid: defaultUid, name: '開成チャレンジャー', avatar: '⚔️', testDate: '',
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

  const [folders, setFolders] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bossData, setBossData] = useState(INITIAL_BOSSES[0]);

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
      if (me && me.isKicked) {
        alert('このグループから退去処理されました。');
        setUserProfile(prev => ({ ...prev, secretCode: '' }));
      }
      setLeaderboard(groupUsers.slice(0, 30));
    });
    return () => unsub();
  }, [userProfile.secretCode, userProfile.uid]);

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

  const handleKickUser = async (targetUid) => {
    if (!isAdmin) return;
    if (window.confirm('このユーザーを追放しますか？')) {
      try {
        await updateDoc(doc(db, 'users', targetUid), { isKicked: true });
        alert('追放しました');
      } catch (err) {}
    }
  };

  if (!userProfile.secretCode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-sm w-full text-center space-y-6">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-500 w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Swords className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-2xl font-black text-amber-400">YOSO BATTLE</h1>
          <p className="text-xs font-bold text-slate-400 leading-relaxed">
            同じ合言葉を入力して<br/>クラスメイトとバトルを開始しよう！
          </p>
          <form onSubmit={(e) => { e.preventDefault(); if(tempCode.trim()) setUserProfile({...userProfile, secretCode: tempCode.trim()}); }}>
            <input 
              type="text" 
              required 
              value={tempCode} 
              onChange={e => setTempCode(e.target.value)} 
              placeholder="例: kaisei2026" 
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-500 p-4 rounded-2xl text-center text-lg font-black outline-none text-white transition mb-4" 
            />
            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 py-4 rounded-2xl font-black shadow-lg">
              バトルルームに入る
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-24">
      <header className="bg-slate-800/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-700 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); setIsFlashcardMode(false); }}>
          <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-2 rounded-2xl"><Swords className="w-5 h-5 text-stone-900" /></div>
          <h1 className="font-black text-xl tracking-wider text-amber-400">YOSO BATTLE</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfileModal(true)} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-600 flex items-center gap-2">
            <span className="bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full text-[10px] font-black">Lv.{userProfile.level}</span>
            <span className="truncate max-w-[90px]">{userProfile.avatar} {userProfile.name}</span>
          </button>
          <button onClick={() => setShowMenuDrawer(true)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-2xl text-slate-200"><Menu className="w-5 h-5" /></button>
        </div>
      </header>

      {showMenuDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-slate-800 w-64 h-full p-6 space-y-6 flex flex-col justify-between border-l border-slate-700 shadow-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <h3 className="font-extrabold text-sm text-slate-300">メニュー</h3>
                <button onClick={() => setShowMenuDrawer(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-2">
                <button onClick={() => { setShowQrModal(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-orange-400"><QrCode className="w-4 h-4"/> 招待QRを表示</button>
                <button onClick={() => { setShowMemberList(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-indigo-400"><Users className="w-4 h-4"/> メンバー一覧</button>
                <button onClick={() => { setShowHistoryModal(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-purple-400"><History className="w-4 h-4"/> アプリの歴史</button>
                <button onClick={() => { setShowHelpModal(true); setShowMenuDrawer(false); }} className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-amber-400"><HelpCircle className="w-4 h-4"/> 使い方・ルール</button>
              </div>
            </div>
            <button onClick={() => { if(window.confirm('グループから退出しますか？')) { setUserProfile({...userProfile, secretCode: ''}); setShowMenuDrawer(false); } }} className="w-full py-3 bg-rose-500/20 text-rose-400 rounded-2xl text-xs font-black flex items-center justify-center gap-1 border border-rose-500/30"><LogOut className="w-4 h-4"/> 部屋を出る</button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 flex-1 w-full space-y-6">
        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)} 
            currentUid={userProfile.uid}
            onBack={() => setSelectedQuestionId(null)}
            onAttackBoss={(dmg) => {
              setBossData(prev => ({ ...prev, currentHp: Math.max(0, prev.currentHp - dmg) }));
              gainXP(Math.floor(dmg / 10), null);
            }}
            onAddComment={async (qId, text) => {
              const q = questions.find(item => item.id === qId);
              await updateDoc(doc(db, 'questions', qId), {
                comments: [...(q.comments || []), { id: 'c_' + Date.now(), user: userProfile.name, text }]
              });
              gainXP(5, null);
            }}
          />
        ) : isFlashcardMode ? (
          <FlashcardView questions={questions} onBack={() => setIsFlashcardMode(false)} />
        ) : (
          <>
            {activeTab === 'home' && (
              <div className="space-y-6">
                <BossBattle bossData={bossData} questions={questions} onSelectQuestion={setSelectedQuestionId} />
                
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-200">📁 デッキフォルダ & 予想カード一覧</h3>
                    <button onClick={() => setIsFlashcardMode(true)} className="bg-slate-800 border border-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-black hover:bg-slate-700">🎴 単語帳モード</button>
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
              </div>
            )}
            {activeTab === 'create' && <CreateCardView folders={folders} userProfile={userProfile} onSuccess={() => { gainXP(50, 'totalPosts'); setActiveTab('home'); }} />}
            {activeTab === 'chat' && <ChatView userProfile={userProfile} onMessageSent={() => gainXP(10, 'totalChats')} />}
            {activeTab === 'ranking' && <RankingView leaderboard={leaderboard} currentUid={userProfile.uid} />}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-md border-t border-slate-700 p-2 z-30 flex justify-around shadow-2xl rounded-t-3xl">
        <NavBtn active={activeTab === 'home'} icon={<Home className="w-6 h-6" />} label="バトル" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); setIsFlashcardMode(false); }} />
        <NavBtn active={activeTab === 'create'} icon={<PlusCircle className="w-6 h-6" />} label="カード作成" onClick={() => { setActiveTab('create'); setSelectedQuestionId(null); setIsFlashcardMode(false); }} />
        <NavBtn active={activeTab === 'chat'} icon={<MessageCircle className="w-6 h-6" />} label="チャット" onClick={() => { setActiveTab('chat'); setSelectedQuestionId(null); setIsFlashcardMode(false); }} />
        <NavBtn active={activeTab === 'ranking'} icon={<Trophy className="w-6 h-6" />} label="順位" onClick={() => { setActiveTab('ranking'); setSelectedQuestionId(null); setIsFlashcardMode(false); }} />
      </nav>

      {showProfileModal && (
        <UserProfileModal 
          userProfile={userProfile} 
          setUserProfile={setUserProfile} 
          badges={BADGES} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}

      {showMemberList && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-3xl max-w-sm w-full border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
            <h3 className="font-black text-lg text-slate-100 border-b border-slate-700 pb-3 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400"/> 参加メンバー</h3>
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {leaderboard.map(u => (
                <div key={u.uid} className="bg-slate-700/50 p-3 rounded-2xl flex items-center justify-between border border-slate-600/50">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{u.avatar || '⚔️'}</span>
                    <div>
                      <div className="text-xs font-extrabold text-white">{u.name}</div>
                      <div className="text-[10px] text-amber-400 font-bold">Lv.{u.level || 1} • {u.xp || 0} XP</div>
                    </div>
                  </div>
                  {isAdmin && u.uid !== userProfile.uid && (
                    <button onClick={() => handleKickUser(u.uid)} className="text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-1 rounded-lg hover:bg-rose-500 hover:text-white transition">追放</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowMemberList(false)} className="mt-4 w-full bg-slate-700 text-slate-200 py-2.5 rounded-xl font-bold text-xs">閉じる</button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-3xl max-w-sm w-full border border-slate-700 text-slate-200 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-black text-base text-purple-400">アプリの歴史</h3>
              {!isAdmin && <button onClick={() => { const pwd = window.prompt('管理者パスワード:'); if (pwd === ADMIN_PASSWORD) setIsAdmin(true); }} className="text-[10px] text-slate-500 underline font-bold">🔑 管理者</button>}
            </div>
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {historyList.map(item => (
                <div key={item.id} className="border-l-2 border-purple-500/50 pl-3 py-1 space-y-0.5">
                  <div className="flex justify-between text-[10px] font-black text-purple-400"><span>{item.version}</span><span>{item.date}</span></div>
                  <h4 className="font-black text-xs text-white">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="bg-purple-600 text-white w-full py-2.5 rounded-xl font-black text-xs">閉じる</button>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-3xl max-w-sm w-full border border-slate-700 text-center space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-amber-400 flex items-center justify-center gap-2"><QrCode className="w-5 h-5"/> 招待QR</h3>
            <div className="bg-white p-4 rounded-2xl inline-block my-2 shadow-inner"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(userProfile.secretCode)}`} alt="QR" className="w-40 h-40"/></div>
            <div className="bg-slate-700 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 flex justify-between items-center"><span>合言葉:</span><span className="text-amber-400 text-sm font-black">{userProfile.secretCode}</span></div>
            <button onClick={() => setShowQrModal(false)} className="w-full bg-amber-500 text-stone-900 py-3 rounded-xl font-black text-xs">閉じる</button>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-3xl max-w-sm w-full border border-slate-700 text-slate-200 shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-center text-amber-400 border-b border-slate-700 pb-3">遊び方ガイド</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-bold">1. カード作成で予想問題を投稿！<br/>2. フォルダで整理したり、単語帳モードで復習可能。<br/>3. 問題を選んで正解し、協力してテストボスを撃破しよう！</p>
            <button onClick={() => setShowHelpModal(false)} className="w-full bg-amber-500 text-stone-900 py-3 rounded-xl text-xs font-black">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateCardView({ folders, userProfile, onSuccess }) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [folderId, setFolderId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [atk, setAtk] = useState(250);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    try {
      await addDoc(collection(db, 'questions'), {
        subject, folderId, author: userProfile.name, avatar: userProfile.avatar, uid: userProfile.uid, secretCode: userProfile.secretCode,
        atk: Number(atk), subQuestions: [{ question, answer }], comments: [], createdAt: new Date().toLocaleDateString('ja-JP')
      });
      onSuccess();
    } catch (err) { alert('作成失敗'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-3xl space-y-4 border border-slate-700 max-w-xl mx-auto shadow-2xl">
      <h2 className="text-lg font-black text-amber-400 flex items-center gap-2"><PlusCircle className="w-5 h-5"/> 新しいスキルカードを作成</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <select value={subject} onChange={e => setSubject(e.target.value)} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white">
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={folderId} onChange={e => setFolderId(e.target.value)} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white">
          <option value="">フォルダ選択（なし）</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <input type="text" required value={question} onChange={e => setQuestion(e.target.value)} placeholder="予想問題を入力..." className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none" />
      <input type="text" required value={answer} onChange={e => setAnswer(e.target.value)} placeholder="正解・解説を入力..." className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs font-bold text-rose-400 outline-none" />
      <div>
        <label className="text-[10px] font-bold text-slate-400 block mb-1">カード威力 (ATK): {atk}</label>
        <input type="range" min="100" max="600" value={atk} onChange={e => setAtk(e.target.value)} className="w-full" />
      </div>
      <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 py-3.5 rounded-xl font-black text-xs shadow-lg">カードを生成する (+50 XP)</button>
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
      <h2 className="text-base font-black text-slate-200 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-amber-400"/> 作戦チャット</h2>
      <div className="flex-1 bg-slate-800 rounded-3xl border border-slate-700 p-4 overflow-y-auto space-y-3 shadow-inner">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.uid === userProfile.uid ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xl">{msg.avatar || '⚔️'}</span>
            <div className={`p-3 rounded-2xl text-xs font-bold ${msg.uid === userProfile.uid ? 'bg-amber-500 text-stone-900' : 'bg-slate-700 text-slate-200'}`}>{msg.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="作戦を入力..." className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-2xl text-xs font-bold text-white outline-none" />
        <button type="submit" className="bg-amber-500 text-stone-900 p-3 rounded-2xl font-black"><Send className="w-4 h-4"/></button>
      </form>
    </div>
  );
}

function RankingView({ leaderboard, currentUid }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-slate-200 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400"/> 開成予想屋 ランキング</h2>
      <div className="space-y-2">
        {leaderboard.map((u, i) => (
          <div key={u.uid} className="bg-slate-800 p-3 rounded-2xl flex items-center justify-between border border-slate-700">
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-slate-400">{i+1}</span>
              <span className="text-xl">{u.avatar || '⚔️'}</span>
              <div><div className="text-xs font-extrabold text-white">{u.name} {u.uid === currentUid && <span className="text-[9px] bg-amber-500 text-stone-900 px-1.5 py-0.5 rounded-md font-black">あなた</span>}</div><div className="text-[10px] font-bold text-amber-400">Lv.{u.level || 1}</div></div>
            </div>
            <span className="text-xs font-black text-slate-300">{u.xp || 0} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all ${active ? 'bg-slate-700 text-amber-400 font-black' : 'text-slate-500'}`}>
      {icon}<span className="text-[9px] mt-0.5">{label}</span>
    </button>
  );
}
