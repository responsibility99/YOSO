import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Clock, FolderPlus, ThumbsUp, 
  Home, PlusCircle, BarChart2, ArrowLeft, Trash2, Calendar, Sparkles,
  MessageCircle, Send, Trophy, Medal, Flame
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

// やり込み要素！充実のバッジリスト
const BADGES = [
  { id: 't1', icon: '🐣', name: 'ひよこ学習者', desc: 'タイマー記録1回', type: 'totalStudySessions', req: 1 },
  { id: 't2', icon: '⏱️', name: '時計の友', desc: 'タイマー記録5回', type: 'totalStudySessions', req: 5 },
  { id: 't3', icon: '🕰️', name: '時の支配者', desc: 'タイマー記録20回', type: 'totalStudySessions', req: 20 },
  { id: 't4', icon: '🔥', name: '精神と時の部屋', desc: 'タイマー記録50回', type: 'totalStudySessions', req: 50 },
  { id: 'p1', icon: '🌱', name: '初投稿', desc: '問題を1回投稿', type: 'totalPosts', req: 1 },
  { id: 'p2', icon: '🛠️', name: '問題職人', desc: '問題を5回投稿', type: 'totalPosts', req: 5 },
  { id: 'p3', icon: '👼', name: '予想の神様', desc: '問題を20回投稿', type: 'totalPosts', req: 20 },
  { id: 'p4', icon: '👑', name: 'YOSOマスター', desc: '問題を50回投稿', type: 'totalPosts', req: 50 },
  { id: 'c1', icon: '👋', name: '初めまして', desc: 'チャット1回送信', type: 'totalChats', req: 1 },
  { id: 'c2', icon: '💬', name: 'おしゃべり', desc: 'チャット10回送信', type: 'totalChats', req: 10 },
  { id: 'c3', icon: '🎉', name: 'ムードメーカー', desc: 'チャット50回送信', type: 'totalChats', req: 50 },
  { id: 'l1', icon: '🥉', name: 'ルーキー', desc: 'レベル5到達', type: 'level', req: 5 },
  { id: 'l2', icon: '🥈', name: 'チャレンジャー', desc: 'レベル10到達', type: 'level', req: 10 },
  { id: 'l3', icon: '🥇', name: 'エリート', desc: 'レベル20到達', type: 'level', req: 20 },
  { id: 'l4', icon: '💎', name: 'レジェンド', desc: 'レベル50到達', type: 'level', req: 50 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  // プロフィールにXP、レベル、各種統計を追加
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('study_app_user_v5');
    const defaultUid = 'user_' + Date.now() + Math.floor(Math.random()*1000);
    return saved ? JSON.parse(saved) : { 
      uid: defaultUid, name: 'テスト対策生', avatar: '🎓', testDate: '',
      xp: 0, level: 1, totalStudySessions: 0, totalPosts: 0, totalChats: 0 
    };
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [studyLogs, setStudyLogs] = useState(() => {
    const saved = localStorage.getItem('study_app_logs_v5');
    return saved ? JSON.parse(saved) : [];
  });

  // ランキング用のユーザー一覧
  const [leaderboard, setLeaderboard] = useState([]);

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

  // ランキングの取得
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(30));
    const unsub = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // プロフィールの保存とFirebase同期
  useEffect(() => {
    localStorage.setItem('study_app_user_v5', JSON.stringify(userProfile));
    localStorage.setItem('study_app_logs_v5', JSON.stringify(studyLogs));
    
    // Firestoreにユーザー情報を同期（ランキング用）
    if (userProfile.uid) {
      const userRef = doc(db, 'users', userProfile.uid);
      setDoc(userRef, userProfile, { merge: true }).catch(e => console.error("Sync error:", e));
    }
  }, [userProfile, studyLogs]);

  // 経験値(XP)を獲得する関数
  const gainXP = (amount, statToIncrement) => {
    setUserProfile(prev => {
      const newXp = (prev.xp || 0) + amount;
      const newLevel = Math.floor(newXp / 100) + 1; // 100XPごとに1レベルアップ
      
      if (newLevel > prev.level) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }

      const updates = { xp: newXp, level: newLevel };
      if (statToIncrement) {
        updates[statToIncrement] = (prev[statToIncrement] || 0) + 1;
      }
      return { ...prev, ...updates };
    });
  };

  const getDaysUntilTest = () => {
    if (!userProfile.testDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tDate = new Date(userProfile.testDate);
    const diffTime = tDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysUntilTest = getDaysUntilTest();

  // 現在獲得しているバッジを計算
  const earnedBadges = BADGES.filter(b => (userProfile[b.type] || 0) >= b.req);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), { name: newFolderName, createdAt: serverTimestamp() });
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (err) {}
  };

  const handleToggleLike = async (qId) => {
    const q = questions.find(item => item.id === qId);
    if (!q) return;
    const qRef = doc(db, 'questions', qId);
    try {
      await updateDoc(qRef, { likes: q.likedByMe ? (q.likes - 1) : (q.likes + 1), likedByMe: !q.likedByMe });
    } catch (err) {}
  };

  const handleDeleteQuestion = async (qId) => {
    if (window.confirm('この予想問題を削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'questions', qId));
        setSelectedQuestionId(null);
      } catch (err) {}
    }
  };

  const handleSaveStudyLog = (logData) => {
    const newLog = { id: 'log_' + Date.now(), ...logData };
    setStudyLogs([newLog, ...studyLogs]);
    gainXP(30, 'totalStudySessions'); // 学習1回で30XP
    setActiveTab('records');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 text-stone-800 flex flex-col font-sans pb-24">
      {/* レベルアップ通知 */}
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
          <h1 className="font-extrabold text-lg drop-shadow-md">YOSO<Sparkles className="inline w-4 h-4 ml-1 text-yellow-200" /></h1>
        </div>
        
        <button onClick={() => setShowProfileModal(true)} className="bg-white/90 hover:bg-white text-stone-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-md transition transform hover:scale-105 flex items-center gap-2">
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">Lv.{userProfile.level}</span>
          <span>{userProfile.avatar} {userProfile.name}</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex-1 w-full flex flex-col">
        {activeTab === 'home' && !selectedQuestionId && (
          <div onClick={() => setShowProfileModal(true)} className="mb-6 cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 rounded-3xl shadow-xl text-white relative overflow-hidden transform transition hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Calendar className="w-24 h-24" /></div>
            <div className="relative z-10">
              <h2 className="text-sm font-bold text-white/90 mb-1">定期テストまであと...</h2>
              {daysUntilTest !== null ? (
                daysUntilTest > 0 ? (
                  <div className="text-4xl font-extrabold drop-shadow-lg">{daysUntilTest} <span className="text-xl">日</span></div>
                ) : daysUntilTest === 0 ? (
                  <div className="text-4xl font-extrabold drop-shadow-lg text-yellow-300">今日がテスト！🔥</div>
                ) : (
                  <div className="text-2xl font-extrabold drop-shadow-lg">テストお疲れ様！🎉</div>
                )
              ) : (
                <div className="text-lg font-bold underline decoration-pink-300 underline-offset-4 mt-1">ここをタップしてテスト日程を設定！</div>
              )}
              
              {/* XPプログレスバー */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>次のレベルまで</span>
                  <span>{userProfile.xp % 100} / 100 XP</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2">
                  <div className="bg-yellow-300 h-2 rounded-full transition-all duration-500" style={{ width: `${(userProfile.xp % 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)} 
            onBack={() => setSelectedQuestionId(null)}
            onDelete={handleDeleteQuestion}
            onAddComment={async (qId, text) => {
              const q = questions.find(item => item.id === qId);
              if (!q) return;
              const newComments = [...(q.comments || []), { id: 'c_' + Date.now(), user: userProfile.name, text }];
              await updateDoc(doc(db, 'questions', qId), { comments: newComments });
              gainXP(5, null); // コメントで5XP
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView 
                folders={folders} questions={questions}
                onSelectQuestion={(id) => setSelectedQuestionId(id)}
                onOpenFolderModal={() => setShowFolderModal(true)}
                onToggleLike={handleToggleLike}
              />
            )}
            {activeTab === 'create' && (
              <CreateQuestionView 
                folders={folders} defaultFolderId={selectedFolderId || (folders[0] ? folders[0].id : '')}
                userProfile={userProfile}
                onSuccess={() => { gainXP(50, 'totalPosts'); setActiveTab('home'); }} // 投稿で50XP
              />
            )}
            {activeTab === 'chat' && (
              <ChatView userProfile={userProfile} onMessageSent={() => gainXP(10, 'totalChats')} /> // チャット送信で10XP
            )}
            {activeTab === 'timer' && (
              <TimerView onSaveLog={handleSaveStudyLog} />
            )}
            {activeTab === 'records' && (
              <RecordsView studyLogs={studyLogs} onClearLogs={() => setStudyLogs([])} />
            )}
            {/* 新機能：ランキングタブ */}
            {activeTab === 'ranking' && (
              <RankingView leaderboard={leaderboard} currentUid={userProfile.uid} />
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-amber-100 p-2 z-30 flex justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-2xl">
        <NavButton active={activeTab === 'home'} icon={<Home className="w-6 h-6" />} label="ホーム" onClick={() => { setActiveTab('home'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'create'} icon={<PlusCircle className="w-6 h-6" />} label="投稿" onClick={() => { setActiveTab('create'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'chat'} icon={<MessageCircle className="w-6 h-6" />} label="チャット" onClick={() => { setActiveTab('chat'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'ranking'} icon={<Trophy className="w-6 h-6" />} label="ランキング" onClick={() => { setActiveTab('ranking'); setSelectedQuestionId(null); }} />
        <NavButton active={activeTab === 'timer'} icon={<Clock className="w-6 h-6" />} label="タイマー" onClick={() => { setActiveTab('timer'); setSelectedQuestionId(null); }} />
      </nav>

      {/* プロフィール＆バッジ確認モーダル */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl transform transition-all flex flex-col max-h-[85vh]">
            <h3 className="font-extrabold text-xl text-center text-amber-900 border-b pb-3 mb-4">マイプロフィール</h3>
            
            <div className="overflow-y-auto pr-2 space-y-5 flex-1">
              <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <div className="text-4xl">{userProfile.avatar}</div>
                <div>
                  <div className="font-extrabold text-lg text-stone-800">{userProfile.name}</div>
                  <div className="text-sm font-bold text-amber-600 flex items-center gap-1">
                    <Medal className="w-4 h-4" /> レベル {userProfile.level} (累計 {userProfile.xp} XP)
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-500 mb-1 block">ニックネーム</label>
                  <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })} className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-400 p-2.5 rounded-xl text-sm outline-none font-bold transition" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 mb-1 block">アイコン (絵文字)</label>
                  <input type="text" value={userProfile.avatar} onChange={(e) => setUserProfile({ ...userProfile, avatar: e.target.value })} className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-400 p-2.5 rounded-xl text-sm outline-none font-bold transition" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 mb-1 block">テスト日程</label>
                  <input type="date" value={userProfile.testDate} onChange={(e) => setUserProfile({ ...userProfile, testDate: e.target.value })} className="w-full bg-stone-50 border-2 border-stone-200 focus:border-indigo-400 p-2.5 rounded-xl text-sm outline-none font-bold transition text-indigo-700" />
                </div>
              </div>

              {/* バッジコレクション */}
              <div className="pt-2">
                <h4 className="font-extrabold text-sm text-stone-700 mb-2 flex items-center gap-1"><Trophy className="w-4 h-4 text-yellow-500" /> 獲得したバッジ ({earnedBadges.length}/{BADGES.length})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {BADGES.map(badge => {
                    const isEarned = (userProfile[badge.type] || 0) >= badge.req;
                    return (
                      <div key={badge.id} className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border-2 transition-all ${isEarned ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-stone-50 border-stone-100 opacity-40 grayscale'}`}>
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <div className="text-[9px] font-extrabold text-stone-700 leading-tight">{badge.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={() => setShowProfileModal(false)} className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-xl text-sm font-extrabold shadow-lg transition">
              保存して閉じる
            </button>
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-white p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-amber-900">新規フォルダ作成</h3>
            <input type="text" required value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="フォルダ名を入力" className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-400 p-3 rounded-xl text-sm outline-none transition font-bold" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-sm font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition">キャンセル</button>
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md transition transform hover:scale-105">作成</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${active ? 'bg-amber-100 text-amber-700 font-extrabold shadow-inner' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}>
      <div className={`${active ? 'transform scale-110 mb-0.5' : 'mb-1'} transition-transform`}>{icon}</div>
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

// === 新機能：ランキングビュー ===
function RankingView({ leaderboard, currentUid }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-extrabold text-stone-700">全国ランキング</h2>
      </div>
      
      <div className="bg-white rounded-3xl p-4 shadow-lg border border-amber-100 space-y-3">
        {leaderboard.length === 0 && <p className="text-stone-400 text-sm font-bold text-center py-4">データがありません</p>}
        {leaderboard.map((user, index) => {
          const isMe = user.uid === currentUid;
          const rankColors = index === 0 ? 'bg-yellow-100 border-yellow-300' : index === 1 ? 'bg-gray-100 border-gray-300' : index === 2 ? 'bg-orange-100 border-orange-300' : 'bg-stone-50 border-stone-100';
          const rankTextColors = index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-500' : index === 2 ? 'text-orange-600' : 'text-stone-400';
          
          return (
            <div key={user.uid} className={`flex items-center justify-between p-3 rounded-2xl border-2 ${rankColors} ${isMe ? 'ring-2 ring-amber-400' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 font-extrabold text-lg text-center ${rankTextColors}`}>
                  {index + 1}
                </div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-stone-200">
                  {user.avatar || '🎓'}
                </div>
                <div>
                  <div className="font-extrabold text-stone-800 text-sm flex items-center gap-2">
                    {user.name || '名無し'} {isMe && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">あなた</span>}
                  </div>
                  <div className="text-xs font-bold text-amber-600">Lv. {user.level || 1}</div>
                </div>
              </div>
              <div className="font-extrabold text-stone-600 text-sm">
                {user.xp || 0} <span className="text-[10px] text-stone-400">XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === チャット機能 ===
function ChatView({ userProfile, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'chats'), (snapshot) => {
      let msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.createdAt?.toMillis?.() || Date.now()) - (b.createdAt?.toMillis?.() || Date.now()));
      setMessages(msgs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'chats'), {
        text: newMessage, user: userProfile.name, avatar: userProfile.avatar, uid: userProfile.uid, createdAt: serverTimestamp()
      });
      setNewMessage('');
      onMessageSent();
    } catch (err) {}
  };

  return (
    <div className="flex flex-col flex-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageCircle className="w-6 h-6 text-amber-500" />
        <h2 className="text-xl font-extrabold text-stone-700">みんなのチャット</h2>
      </div>
      
      <div className="flex-1 bg-stone-50/70 rounded-3xl border border-amber-100 shadow-inner p-4 overflow-y-auto space-y-4">
        {messages.map(msg => {
          const isMe = msg.uid === userProfile.uid;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-9 h-9 flex-shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm text-lg border border-stone-200">{msg.avatar || '🎓'}</div>
              <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[11px] font-bold text-stone-400 mb-1 px-1">{msg.user}</span>
                <div className={`p-3 rounded-2xl text-sm font-bold shadow-sm ${isMe ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white rounded-tr-sm' : 'bg-white text-stone-700 rounded-tl-sm border border-stone-200'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="発言してXPをゲット！" className="flex-1 bg-white border-2 border-stone-200 focus:border-amber-400 p-3.5 rounded-2xl text-sm outline-none font-bold shadow-sm transition" />
        <button type="submit" disabled={!newMessage.trim()} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white p-3.5 rounded-2xl shadow-md transition transform hover:scale-105"><Send className="w-5 h-5" /></button>
      </form>
    </div>
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
    try {
      await addDoc(collection(db, 'questions'), {
        folderId, subject, title, author: userProfile.name, avatar: userProfile.avatar, uid: userProfile.uid,
        likes: 0, likedByMe: false, subQuestions, comments: [], createdAt: new Date().toLocaleDateString('ja-JP')
      });
      onSuccess();
    } catch (err) { alert('投稿に失敗しました'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl space-y-5 shadow-xl border border-amber-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-extrabold flex items-center gap-2 text-amber-900"><PlusCircle className="w-6 h-6 text-orange-500" /> 問題をつくる <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">+50 XP</span></h2>
      <div className="bg-stone-50 p-4 rounded-2xl space-y-4 border border-stone-100">
        <div>
          <label className="text-xs font-bold text-stone-500 mb-1 block">フォルダ</label>
          <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="w-full border-2 border-stone-200 focus:border-amber-400 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        </div>
        <div>
          <label className="text-xs font-bold text-stone-500 mb-1 block">教科</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border-2 border-stone-200 focus:border-amber-400 p-2.5 rounded-xl text-sm bg-white font-bold outline-none">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div>
          <label className="text-xs font-bold text-stone-500 mb-1 block">タイトル</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 中間テスト対策 漢字10問" className="w-full border-2 border-stone-200 focus:border-amber-400 p-2.5 rounded-xl text-sm bg-white font-bold outline-none" />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-extrabold text-amber-900 block">問題と解答</label>
        {subQuestions.map((sq, i) => (
          <div key={i} className="p-4 bg-orange-50/50 rounded-2xl space-y-2 border border-orange-100 shadow-sm relative">
            <div className="absolute top-2 right-2 text-xs font-bold text-orange-300">Q{i+1}</div>
            <input type="text" value={sq.question} onChange={(e) => handleSubQuestionChange(i, 'question', e.target.value)} placeholder="問題を入力" className="w-full border-2 border-orange-100 focus:border-orange-400 p-2.5 rounded-xl text-sm bg-white font-bold outline-none" />
            <input type="text" value={sq.answer} onChange={(e) => handleSubQuestionChange(i, 'answer', e.target.value)} placeholder="解答を入力" className="w-full border-2 border-rose-100 focus:border-rose-400 p-2.5 rounded-xl text-sm bg-white font-bold outline-none text-rose-700" />
          </div>
        ))}
        <button type="button" onClick={() => setSubQuestions([...subQuestions, { question: '', answer: '' }])} className="w-full py-3 border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 rounded-2xl text-sm font-bold transition">+ 問題を追加する</button>
      </div>
      <button type="submit" className="w-full bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white py-3.5 rounded-2xl text-base font-extrabold shadow-lg transition transform hover:scale-[1.02]">公開してXPを獲得！🚀</button>
    </form>
  );
}

function QuestionDetailView({ question, onBack, onDelete, onAddComment }) {
  const [commentText, setCommentText] = useState('');
  const [showAnswers, setShowAnswers] = useState({});

  if (!question) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-amber-700 bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-amber-50 transition"><ArrowLeft className="w-4 h-4" /> 戻る</button>
        <button onClick={() => onDelete(question.id)} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-white border border-rose-100 px-3 py-1.5 rounded-full shadow-sm hover:bg-rose-50 transition"><Trash2 className="w-3.5 h-3.5" /> 削除</button>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300"></div>
        <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs font-extrabold rounded-lg shadow-sm">{question.subject}</div>
        <h2 className="text-2xl font-extrabold text-stone-800">{question.title}</h2>
        <p className="text-xs font-bold text-stone-400 flex items-center gap-1">作成者: <span className="text-stone-600">{question.author || '名無し'}</span></p>
        
        <div className="space-y-3 pt-4 border-t border-stone-100">
          {(question.subQuestions || []).map((sq, i) => (
            <div key={i} className="p-4 bg-gradient-to-b from-stone-50 to-white border border-stone-200 rounded-2xl shadow-sm">
              <p className="font-extrabold text-sm text-stone-700 mb-3"><span className="text-amber-500 mr-1">Q{i+1}.</span> {sq.question}</p>
              <div>
                {showAnswers[i] ? (
                  <div className="space-y-2 animate-fade-in">
                    <div className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 font-extrabold shadow-inner flex items-center gap-2"><Sparkles className="w-4 h-4 text-rose-400" /> {sq.answer}</div>
                    <button onClick={() => setShowAnswers(p => ({...p, [i]: false}))} className="text-[11px] text-stone-400 font-bold underline hover:text-stone-600 pl-1">答えを隠す</button>
                  </div>
                ) : (
                  <button onClick={() => setShowAnswers(p => ({...p, [i]: true}))} className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-sm font-extrabold shadow-sm transition transform hover:scale-[1.01] active:scale-95">答えを見る 👀</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-lg space-y-4">
        <h3 className="font-extrabold text-base text-stone-700 flex items-center gap-2">💬 コメント</h3>
        <div className="flex gap-2">
          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="応援や感想を書こう！ (+5 XP)" className="flex-1 bg-stone-50 border-2 border-stone-200 focus:border-amber-400 p-2.5 rounded-xl text-sm outline-none font-bold transition" />
          <button onClick={() => { if (commentText) { onAddComment(question.id, commentText); setCommentText(''); } }} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-extrabold shadow-md transition transform hover:scale-105">送信</button>
        </div>
        <div className="space-y-2 pt-2">
          {(question.comments || []).map(c => (
            <div key={c.id} className="text-sm bg-stone-50 p-3 rounded-2xl border border-stone-100"><span className="font-extrabold text-amber-700 mr-2">{c.user}</span><span className="font-medium text-stone-600">{c.text}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeView({ folders, questions, onSelectQuestion, onOpenFolderModal, onToggleLike }) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-extrabold text-stone-700 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-amber-500" /> フォルダ</h2>
          <button onClick={onOpenFolderModal} className="text-xs text-orange-700 font-extrabold bg-orange-100 hover:bg-orange-200 px-4 py-2 rounded-full shadow-sm transition">＋ 作成</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {folders.map(f => (
            <div key={f.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-md hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1">
              <FolderPlus className="w-8 h-8 text-amber-400 mb-2 opacity-80" />
              <h3 className="font-extrabold text-sm text-stone-700 line-clamp-1">{f.name}</h3>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-stone-700 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-400" /> みんなの予想問題</h2>
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} onClick={() => onSelectQuestion(q.id)} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-md hover:shadow-xl transition cursor-pointer space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-rose-400 transform origin-top transition-transform scale-y-0 group-hover:scale-y-100"></div>
              <div>
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md shadow-sm">{q.subject}</span>
              </div>
              <h3 className="font-extrabold text-lg text-stone-800 leading-tight">{q.title}</h3>
              <div className="flex justify-between items-center text-xs border-t border-stone-100 pt-3 mt-1">
                <span className="font-bold text-stone-400">作成: {q.author || '名無し'}</span>
                <button onClick={(e) => { e.stopPropagation(); onToggleLike(q.id); }} className={`flex items-center gap-1.5 font-extrabold px-3 py-1.5 rounded-full transition ${q.likedByMe ? 'bg-rose-100 text-rose-600' : 'bg-stone-50 text-stone-500 hover:bg-rose-50 hover:text-rose-500'}`}>
                  <ThumbsUp className="w-4 h-4" /> {q.likes || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
