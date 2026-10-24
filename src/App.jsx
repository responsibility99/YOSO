import './index.css';
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Calendar, FolderPlus, Plus, Search, ThumbsUp, 
  MessageSquare, User, Home, PlusCircle, BarChart2, CheckCircle, 
  Trash2, ChevronDown, ChevronUp, ArrowLeft, Play, Pause, RotateCcw, 
  Settings, Award, Sparkles, Filter, ShieldCheck, Edit3, Flame,
  TrendingUp, PieChart, Layers, CheckCircle2, Zap, AlertCircle, Camera, Image as ImageIcon
} from 'lucide-react';

// 13科目リスト
const SUBJECTS = [
  '国語1', '国語２a', '国語２ｂ', '歴史', '地理', 
  '数学Ａ', '数学Ｂ', '化学', '生物', '地学', 
  '音楽', '英語１', '英語２'
];

// グラフ用カラーパレット
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

  const [examConfig, setExamConfig] = useState(() => {
    const saved = localStorage.getItem('study_app_exam_v3');
    return saved ? JSON.parse(saved) : { name: '定期テスト', date: '2026-11-15' };
  });
  const [isEditingExam, setIsEditingExam] = useState(false);

  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('study_app_folders_v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('study_app_questions_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [studyLogs, setStudyLogs] = useState(() => {
    const saved = localStorage.getItem('study_app_logs_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [deleteConfirmQId, setDeleteConfirmQId] = useState(null);

  useEffect(() => {
    localStorage.setItem('study_app_user_v3', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('study_app_exam_v3', JSON.stringify(examConfig));
  }, [examConfig]);

  useEffect(() => {
    localStorage.setItem('study_app_folders_v3', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('study_app_questions_v3', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('study_app_logs_v3', JSON.stringify(studyLogs));
  }, [studyLogs]);

  const calculateDaysLeft = (targetDateStr) => {
    const target = new Date(targetDateStr);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(examConfig.date);

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: 'f_' + Date.now(),
      name: newFolderName,
      description: newFolderDesc || '教科書・テスト範囲のまとめ'
    };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setNewFolderDesc('');
    setShowFolderModal(false);
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

  const handleToggleLike = (qId) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          likes: q.likedByMe ? q.likes - 1 : q.likes + 1,
          likedByMe: !q.likedByMe
        };
      }
      return q;
    }));
  };

  const handleDeleteQuestion = (qId) => {
    setQuestions(questions.filter(q => q.id !== qId));
    setDeleteConfirmQId(null);
    setSelectedQuestionId(null);
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

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 flex flex-col font-sans pb-24 md:pb-8">
      {/* トップヘッダー */}
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

          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 bg-amber-100/60 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-all text-sm font-medium border border-amber-200/80 text-amber-900"
          >
            <UserAvatar avatar={userProfile.avatar} customAvatar={userProfile.customAvatar} size="w-6 h-6" />
            <span className="max-w-[100px] truncate">{userProfile.name}</span>
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full">
        {selectedQuestionId ? (
          <QuestionDetailView 
            question={questions.find(q => q.id === selectedQuestionId)} 
            onBack={() => setSelectedQuestionId(null)}
            userProfile={userProfile}
            onToggleLike={handleToggleLike}
            onPromptDelete={(qId) => setDeleteConfirmQId(qId)}
            onAddComment={(qId, text) => {
              setQuestions(questions.map(q => {
                if (q.id === qId) {
                  return {
                    ...q,
                    comments: [...q.comments, {
                      id: 'c_' + Date.now(),
                      user: userProfile.name,
                      avatar: userProfile.avatar,
                      customAvatar: userProfile.customAvatar,
                      text,
                      time: 'たった今'
                    }]
                  };
                }
                return q;
              }));
            }}
          />
        ) : selectedFolderId ? (
          <FolderDetailView 
            folder={folders.find(f => f.id === selectedFolderId)}
            questions={questions.filter(q => q.folderId === selectedFolderId)}
            onBack={() => setSelectedFolderId(null)}
            onSelectQuestion={(qId) => setSelectedQuestionId(qId)}
            onToggleLike={handleToggleLike}
            onCreateInFolder={() => setActiveTab('create')}
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
                onOpenFolderModal={() => setShowFolderModal(true)}
                onSubmit={(newQ) => {
                  setQuestions([newQ, ...questions]);
                  setSelectedFolderId(newQ.folderId);
                  setActiveTab('home');
                }}
              />
            )}

            {activeTab === 'timer' && (
              <TimerView onSaveLog={handleAddStudyLog} />
            )}

            {activeTab === 'records' && (
              <EnhancedRecordsView studyLogs={studyLogs} onClearLogs={() => setStudyLogs([])} />
            )}
          </>
        )}
      </main>

      {/* フッターナビゲーションバー（スマホ用） */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-amber-200/80 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <NavButton 
            active={activeTab === 'home' && !selectedFolderId && !selectedQuestionId} 
            icon={<Home className="w-5 h-5" />} 
            label="ホーム" 
            onClick={() => { setActiveTab('home'); setSelectedFolderId(null); setSelectedQuestionId(null); }} 
          />
          <NavButton 
            active={activeTab === 'create'} 
            icon={<PlusCircle className="w-5 h-5" />} 
            label="投稿する" 
            onClick={() => { setActiveTab('create'); setSelectedFolderId(null); setSelectedQuestionId(null); }} 
          />
          <NavButton 
            active={activeTab === 'timer'} 
            icon={<Clock className="w-5 h-5" />} 
            label="タイマー" 
            onClick={() => { setActiveTab('timer'); setSelectedFolderId(null); setSelectedQuestionId(null); }} 
          />
          <NavButton 
            active={activeTab === 'records'} 
            icon={<BarChart2 className="w-5 h-5" />} 
            label="分析・記録" 
            onClick={() => { setActiveTab('records'); setSelectedFolderId(null); setSelectedQuestionId(null); }} 
          />
        </div>
      </nav>

      {/* プロフィール設定モーダル */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-amber-100 space-y-4">
            <h3 className="text-lg font-bold text-stone-800">プロフィール設定</h3>
            
            <div className="flex flex-col items-center justify-center space-y-3 py-2">
              <div className="relative group">
                <UserAvatar avatar={userProfile.avatar} customAvatar={userProfile.customAvatar} size="w-20 h-20" textStyle="text-3xl" />
                <label className="absolute bottom-0 right-0 bg-amber-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-amber-700 shadow-md transition">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="flex gap-2 text-xs">
                {userProfile.customAvatar && (
                  <button 
                    onClick={() => setUserProfile({ ...userProfile, customAvatar: null })}
                    className="text-rose-600 hover:underline"
                  >
                    画像を解除する
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">表示名</label>
              <input 
                type="text" 
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">絵文字アイコンを選択</label>
              <div className="flex justify-between">
                {['🎓', '✏️', '🧪', '📖', '🌟', '🐶', '🔥'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => setUserProfile({ ...userProfile, avatar: emoji, customAvatar: null })}
                    className={`text-xl p-2 rounded-xl border transition ${
                      userProfile.avatar === emoji && !userProfile.customAvatar 
                        ? 'border-amber-600 bg-amber-50 scale-105' 
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition shadow-sm"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteConfirmQId && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-100 space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-800">予想問題を削除しますか？</h3>
              <p className="text-xs text-stone-500 mt-1">この操作は取り消せません。本当に削除しますか？</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeleteConfirmQId(null)}
                className="flex-1 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl"
              >
                キャンセル
              </button>
              <button 
                onClick={() => handleDeleteQuestion(deleteConfirmQId)}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* テスト日程設定モーダル */}
      {isEditingExam && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-amber-100 space-y-4">
            <h3 className="text-lg font-bold text-stone-800">定期テスト日程の設定</h3>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">テスト名</label>
              <input 
                type="text" 
                value={examConfig.name}
                onChange={(e) => setExamConfig({ ...examConfig, name: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="例: 2学期中間テスト"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">試験開始日</label>
              <input 
                type="date" 
                value={examConfig.date}
                onChange={(e) => setExamConfig({ ...examConfig, date: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setIsEditingExam(false)}
                className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition shadow-sm"
              >
                決定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フォルダ作成モーダル */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-amber-100 space-y-4">
            <h3 className="text-lg font-bold text-stone-800">新規フォルダ作成</h3>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">フォルダ名</label>
              <input 
                type="text" 
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="例: 中間テスト対策・数学"
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">説明 (任意)</label>
              <input 
                type="text" 
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder="例: 公式問題と予想問題まとめ"
                className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-sm text-stone-600 font-medium hover:bg-stone-100 rounded-xl"
              >
                キャンセル
              </button>
              <button 
                type="submit"
                className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition shadow-sm"
              >
                作成する
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function UserAvatar({ avatar, customAvatar, size = "w-8 h-8", textStyle = "text-base" }) {
  if (customAvatar) {
    return (
      <img 
        src={customAvatar} 
        alt="Avatar" 
        className={`${size} rounded-full object-cover border border-amber-300 shadow-sm flex-shrink-0`} 
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-amber-100 flex items-center justify-center ${textStyle} border border-amber-200 flex-shrink-0`}>
      {avatar || '🎓'}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
        active ? 'text-amber-700 font-bold scale-105' : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      {icon}
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function HomeView({ examConfig, daysLeft, setIsEditingExam, folders, questions, onSelectFolder, onSelectQuestion, onOpenFolderModal, onToggleLike, onGoToCreate }) {
  const recentQuestions = [...questions].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* カウントダウンカード */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-200" />
              <span className="text-xs font-semibold text-amber-200 tracking-wider uppercase">{examConfig.name}</span>
              <button 
                onClick={() => setIsEditingExam(true)}
                className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white flex items-center gap-1 ml-2 transition"
              >
                <Edit3 className="w-3 h-3" /> 日程設定
              </button>
            </div>
            <h2 className="text-xl md:text-2xl font-bold">テスト勉強をスタートしよう！</h2>
            <p className="text-xs text-amber-100 mt-1">試験日: {examConfig.date}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-center self-stretch md:self-auto flex flex-col justify-center">
            <span className="text-xs text-amber-100 font-medium">残り日数</span>
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {daysLeft > 0 ? `あと ${daysLeft} 日` : daysLeft === 0 ? '本日試験日！' : '試験終了'}
            </span>
          </div>
        </div>
      </div>

      {/* フォルダ一覧セクション */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            テスト対策フォルダ
          </h2>
          <button 
            onClick={onOpenFolderModal}
            className="text-xs text-amber-800 font-bold hover:text-amber-900 flex items-center gap-1 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-200/80 transition"
          >
            <FolderPlus className="w-4 h-4" /> フォルダを作成
          </button>
        </div>

        {folders.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-dashed border-amber-200 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-700">フォルダがまだありません</p>
              <p className="text-xs text-stone-500 mt-1">「中間テスト対策」や「科目別」などのフォルダを作成して問題を整理しましょう！</p>
            </div>
            <button 
              onClick={onOpenFolderModal}
              className="bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-700 transition shadow-sm"
            >
              最初のフォルダを作成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {folders.map(folder => {
              const count = questions.filter(q => q.folderId === folder.id).length;
              return (
                <div 
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className="bg-white p-4 rounded-xl border border-stone-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex justify-between items-center group"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition">{folder.name}</h3>
                    <p className="text-xs text-stone-500 line-clamp-1">{folder.description}</p>
                    <span className="inline-block text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-100 mt-1">
                      {count} 件の予想問題
                    </span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-stone-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 最新問題一覧 */}
      <div>
        <h2 className="text-base font-bold text-stone-800 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          最新の予想問題
        </h2>
        
        {recentQuestions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-dashed border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-full flex items-center justify-center mx-auto">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-700">予想問題がまだ投稿されていません</p>
              <p className="text-xs text-stone-500 mt-1">自分でテストに出そうな問題を書いて投稿してみましょう！</p>
            </div>
            <button 
              onClick={onGoToCreate}
              className="bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-700 transition shadow-sm"
            >
              予想問題を作成する
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentQuestions.map(q => (
              <QuestionCard 
                key={q.id} 
                question={q} 
                onSelect={() => onSelectQuestion(q.id)} 
                onToggleLike={() => onToggleLike(q.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ question, onSelect, onToggleLike }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3">
      <div className="cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold bg-amber-100/70 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200/60">
            {question.subject}
          </span>
          <span className="text-xs text-stone-400">{question.createdAt}</span>
        </div>
        <h3 className="font-bold text-stone-800 text-base mb-1 hover:text-amber-700 transition">{question.title}</h3>
        <p className="text-xs text-stone-500">収録問題数: {question.subQuestions ? question.subQuestions.length : 0} 問</p>
      </div>

      <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <UserAvatar avatar={question.avatar} customAvatar={question.customAvatar} size="w-5 h-5" textStyle="text-xs" />
          <span className="font-medium text-stone-600">{question.author}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
            className={`flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full transition ${
              question.likedByMe ? 'bg-amber-100 text-amber-800' : 'hover:bg-stone-100 text-stone-600'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${question.likedByMe ? 'fill-amber-700 text-amber-700' : ''}`} />
            <span>出題されそう！ ({question.likes})</span>
          </button>
          <div className="flex items-center gap-1 text-stone-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{question.comments ? question.comments.length : 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderDetailView({ folder, questions, onBack, onSelectQuestion, onToggleLike, onCreateInFolder }) {
  const sortedQuestions = [...questions].sort((a, b) => b.likes - a.likes);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
        <ArrowLeft className="w-4 h-4" /> ホームへ戻る
      </button>

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-stone-800">{folder ? folder.name : 'フォルダ'}</h2>
          <p className="text-xs text-stone-500 mt-1">{folder ? folder.description : ''}</p>
        </div>
        <button 
          onClick={onCreateInFolder}
          className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-amber-700 transition flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-4 h-4" /> 問題を作成
        </button>
      </div>

      {sortedQuestions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-200 space-y-3">
          <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-500">このフォルダにはまだ問題が投稿されていません。</p>
          <button 
            onClick={onCreateInFolder}
            className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-700 transition"
          >
            最初の予想問題を追加する
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQuestions.map(q => (
            <QuestionCard 
              key={q.id} 
              question={q} 
              onSelect={() => onSelectQuestion(q.id)} 
              onToggleLike={() => onToggleLike(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionDetailView({ question, onBack, userProfile, onToggleLike, onPromptDelete, onAddComment }) {
  const [openExplanations, setOpenExplanations] = useState({});
  const [commentText, setCommentText] = useState('');

  if (!question) return null;

  const toggleExplanation = (index) => {
    setOpenExplanations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(question.id, commentText);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
          <ArrowLeft className="w-4 h-4" /> 一覧へ戻る
        </button>
        <button 
          onClick={() => onPromptDelete(question.id)}
          className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> 投稿を削除
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold bg-amber-100/70 text-amber-800 px-3 py-1 rounded-md border border-amber-200/60">
            {question.subject}
          </span>
          <span className="text-xs text-stone-400">{question.createdAt} 投稿</span>
        </div>
        <h2 className="text-xl font-bold text-stone-800">{question.title}</h2>
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5">
            <UserAvatar avatar={question.avatar} customAvatar={question.customAvatar} size="w-6 h-6" textStyle="text-xs" />
            <span className="font-medium text-stone-700">{question.author}</span>
          </div>
          <button 
            onClick={() => onToggleLike(question.id)}
            className={`flex items-center gap-1 font-bold px-3 py-1.5 rounded-full transition ${
              question.likedByMe ? 'bg-amber-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>出題されそう！ ({question.likes})</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-amber-600" />
          問題と模範解答 ({question.subQuestions ? question.subQuestions.length : 0}問)
        </h3>

        {question.subQuestions && question.subQuestions.map((sq, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
            <div className="font-semibold text-stone-800 text-base leading-relaxed">{sq.q}</div>
            
            <div className="pt-3 border-t border-stone-100">
              <button 
                onClick={() => toggleExplanation(idx)}
                className="flex items-center justify-between w-full bg-amber-50/60 hover:bg-amber-100/60 p-3 rounded-xl transition text-xs font-bold text-amber-800"
              >
                <span>解答・解説を表示する</span>
                {openExplanations[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openExplanations[idx] && (
                <div className="mt-3 p-4 bg-amber-50/80 border border-amber-200/60 rounded-xl space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">模範解答</span>
                    <p className="font-bold text-stone-800 text-sm">{sq.a}</p>
                  </div>
                  {sq.desc && (
                    <div className="pt-2 border-t border-amber-200/60">
                      <span className="text-[11px] font-bold text-stone-500 block mb-1">解説</span>
                      <p className="text-xs text-stone-600 leading-relaxed">{sq.desc}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          コメント・質問 ({question.comments ? question.comments.length : 0})
        </h3>

        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input 
            type="text" 
            placeholder="解き方の質問や感謝を伝えよう..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button 
            type="submit"
            className="bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-700 transition"
          >
            送信
          </button>
        </form>

        <div className="space-y-3 pt-2">
          {question.comments && question.comments.length > 0 ? (
            question.comments.map(c => (
              <div key={c.id} className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <UserAvatar avatar={c.avatar} customAvatar={c.customAvatar} size="w-4 h-4" textStyle="text-[10px]" />
                    <span className="font-bold text-stone-700">{c.user}</span>
                  </div>
                  <span className="text-stone-400">{c.time}</span>
                </div>
                <p className="text-xs text-stone-600 pl-5">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-stone-400 text-center py-2">まだコメントがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateQuestionView({ folders, defaultFolderId, userProfile, onOpenFolderModal, onSubmit }) {
  const [folderId, setFolderId] = useState(defaultFolderId || (folders[0] ? folders[0].id : ''));
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [title, setTitle] = useState('');
  const [subQuestions, setSubQuestions] = useState([
    { q: '', a: '', desc: '' }
  ]);

  useEffect(() => {
    if (folders.length > 0 && !folderId) {
      setFolderId(folders[0].id);
    }
  }, [folders, folderId]);

  const handleSubQuestionChange = (index, field, value) => {
    const updated = [...subQuestions];
    updated[index][field] = value;
    setSubQuestions(updated);
  };

  const addSubQuestion = () => {
    setSubQuestions([...subQuestions, { q: '', a: '', desc: '' }]);
  };

  const removeSubQuestion = (index) => {
    if (subQuestions.length <= 1) return;
    setSubQuestions(subQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !folderId) return;

    const newQuestion = {
      id: 'q_' + Date.now(),
      folderId,
      subject,
      title,
      author: userProfile.name,
      avatar: userProfile.avatar,
      customAvatar: userProfile.customAvatar,
      createdAt: new Date().toLocaleDateString('ja-JP'),
      likes: 0,
      likedByMe: false,
      subQuestions,
      comments: []
    };

    onSubmit(newQuestion);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm">
      <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-amber-600" />
        新しい予想問題を投稿する
      </h2>

      {folders.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>保存先フォルダが必要です。先にフォルダを作成してください。</span>
          </div>
          <button 
            type="button" 
            onClick={onOpenFolderModal}
            className="bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-amber-700 transition flex-shrink-0 ml-2"
          >
            フォルダ作成
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">保存先フォルダ</label>
          <select 
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={folders.length === 0}
            className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-stone-100"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">科目 (13科目から選択)</label>
          <select 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          >
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-500 mb-1">大見出し・タイトル</label>
        <input 
          type="text"
          required
          placeholder="例: 教科書P.45〜48の要点予想問題集"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-stone-700">設問リスト ({subQuestions.length}問)</label>
          <button 
            type="button"
            onClick={addSubQuestion}
            className="text-xs text-amber-800 font-bold hover:text-amber-900 flex items-center gap-1 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80"
          >
            <Plus className="w-3.5 h-3.5" /> 設問を追加
          </button>
        </div>

        {subQuestions.map((sq, idx) => (
          <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 relative">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-700">設問 {idx + 1}</span>
              {subQuestions.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeSubQuestion(idx)}
                  className="text-stone-400 hover:text-rose-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <input 
                type="text" 
                required
                placeholder={`問${idx + 1}. 問題文を入力...`}
                value={sq.q}
                onChange={(e) => handleSubQuestionChange(idx, 'q', e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              />
            </div>

            <div>
              <input 
                type="text" 
                required
                placeholder="模範解答を入力..."
                value={sq.a}
                onChange={(e) => handleSubQuestionChange(idx, 'a', e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white font-semibold"
              />
            </div>

            <div>
              <textarea 
                placeholder="解説・補足メモ (任意)..."
                rows={2}
                value={sq.desc}
                onChange={(e) => handleSubQuestionChange(idx, 'desc', e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-stone-100 flex justify-end">
        <button 
          type="submit"
          disabled={folders.length === 0}
          className="bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-amber-700 transition shadow-md disabled:bg-stone-300"
        >
          投稿を完了する
        </button>
      </div>
    </form>
  );
}

function TimerView({ onSaveLog }) {
  const [mode, setMode] = useState('pomodoro');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'pomodoro') {
          setSecondsLeft(prev => {
            if (prev <= 1) {
              setIsActive(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds(prev => prev + 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'pomodoro') setSecondsLeft(25 * 60);
    else setStopwatchSeconds(0);
  };

  const switchMode = (newMode) => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'pomodoro') setSecondsLeft(25 * 60);
    else setStopwatchSeconds(0);
  };

  const handleSave = () => {
    let minutesRecorded = 0;
    if (mode === 'pomodoro') {
      minutesRecorded = Math.max(1, Math.round((25 * 60 - secondsLeft) / 60));
    } else {
      minutesRecorded = Math.max(1, Math.round(stopwatchSeconds / 60));
    }

    onSaveLog({
      subject: selectedSubject,
      minutes: minutesRecorded
    });

    resetTimer();
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm text-center space-y-6">
      <h2 className="text-lg font-bold text-stone-800 flex items-center justify-center gap-2">
        <Clock className="w-5 h-5 text-amber-600" />
        集中タイマー
      </h2>

      <div className="flex bg-stone-100 p-1 rounded-xl">
        <button 
          onClick={() => switchMode('pomodoro')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            mode === 'pomodoro' ? 'bg-white text-amber-700 shadow-sm' : 'text-stone-500'
          }`}
        >
          ポモドーロ (25分)
        </button>
        <button 
          onClick={() => switchMode('stopwatch')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            mode === 'stopwatch' ? 'bg-white text-amber-700 shadow-sm' : 'text-stone-500'
          }`}
        >
          ストップウォッチ
        </button>
      </div>

      <div className="text-left">
        <label className="block text-xs font-semibold text-stone-500 mb-1">科目を選択 (13科目)</label>
        <select 
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full border border-stone-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        >
          {SUBJECTS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="py-6 bg-amber-50/50 rounded-2xl border border-amber-100">
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-800 font-mono">
          {mode === 'pomodoro' ? formatTime(secondsLeft) : formatTime(stopwatchSeconds)}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button 
          onClick={toggleTimer}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition ${
            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isActive ? '一時停止' : 'スタート'}</span>
        </button>

        <button 
          onClick={resetTimer}
          className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-2">
        <button 
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
        >
          この勉強時間を記録する
        </button>
      </div>
    </div>
  );
}

function EnhancedRecordsView({ studyLogs, onClearLogs }) {
  const totalMinutes = studyLogs.reduce((acc, curr) => acc + curr.minutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const subjectTotals = {};
  SUBJECTS.forEach(s => { subjectTotals[s] = 0; });
  studyLogs.forEach(log => {
    if (subjectTotals[log.subject] !== undefined) {
      subjectTotals[log.subject] += log.minutes;
    } else {
      subjectTotals[log.subject] = log.minutes;
    }
  });

  const activeSubjects = Object.entries(subjectTotals)
    .filter(([_, mins]) => mins > 0)
    .sort((a, b) => b[1] - a[1]);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateISO = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('ja-JP', { weekday: 'short' });
      
      const dayMins = studyLogs
        .filter(l => l.dateISO === dateISO)
        .reduce((sum, l) => sum + l.minutes, 0);

      days.push({ dayLabel, dayMins, dateISO });
    }
    return days;
  };

  const weeklyData = getLast7Days();
  const maxWeeklyMins = Math.max(...weeklyData.map(d => d.dayMins), 60);

  const uniqueSubjectsCount = activeSubjects.length;
  const badges = [
    { title: '初一歩', desc: '勉強時間を初めて記録', icon: '🌱', unlocked: totalMinutes > 0 },
    { title: '30分達成', desc: '合計30分以上勉強', icon: '⏱️', unlocked: totalMinutes >= 30 },
    { title: '1時間突破', desc: '累計1時間を達成！', icon: '🔥', unlocked: totalMinutes >= 60 },
    { title: '3科目制覇', desc: '3科目以上を勉強', icon: '📚', unlocked: uniqueSubjectsCount >= 3 },
    { title: '5時間アチーブ', desc: '累計5時間を突破', icon: '👑', unlocked: totalMinutes >= 300 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Award className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-amber-200 uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> 累計学習レポート
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              {hours} <span className="text-lg font-normal text-amber-100">時間</span> {minutes} <span className="text-lg font-normal text-amber-100">分</span>
            </div>
            <p className="text-xs text-amber-100 mt-1">目標に向かって一歩ずつ前進中！</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/30 text-center">
            <span className="text-xs text-amber-100 block">記録数</span>
            <span className="text-xl font-bold">{studyLogs.length} 回</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
          <PieChart className="w-5 h-5 text-amber-600" />
          科目別学習バランス
        </h3>

        {totalMinutes === 0 ? (
          <div className="text-center py-6 text-stone-400 text-xs">
            学習記録を追加すると、科目ごとのグラフが表示されます
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
              {activeSubjects.map(([subj, mins], idx) => {
                const pct = ((mins / totalMinutes) * 100).toFixed(1);
                return (
                  <div 
                    key={subj} 
                    style={{ width: `${pct}%` }} 
                    className={`${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} h-full transition-all`}
                    title={`${subj}: ${mins}分 (${pct}%)`}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {activeSubjects.map(([subj, mins], idx) => {
                const pct = Math.round((mins / totalMinutes) * 100);
                return (
                  <div key={subj} className="flex items-center gap-2 text-xs bg-stone-50 p-2 rounded-xl">
                    <span className={`w-3 h-3 rounded-full ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}`}></span>
                    <span className="font-semibold text-stone-700 truncate">{subj}</span>
                    <span className="text-stone-400 ml-auto font-mono">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          直近7日間の学習リズム
        </h3>

        <div className="flex items-end justify-between gap-2 h-36 pt-6 pb-2 px-2 border-b border-stone-100">
          {weeklyData.map((d, i) => {
            const barHeightPct = totalMinutes === 0 ? 0 : Math.min(100, Math.round((d.dayMins / maxWeeklyMins) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] text-stone-400 group-hover:text-amber-700 font-mono">
                  {d.dayMins > 0 ? `${d.dayMins}分` : ''}
                </span>
                <div className="w-full bg-stone-100 rounded-t-lg h-24 flex items-end overflow-hidden">
                  <div 
                    style={{ height: `${barHeightPct}%` }}
                    className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all duration-500 group-hover:from-amber-500 group-hover:to-orange-400"
                  />
                </div>
                <span className="text-xs font-semibold text-stone-600">{d.dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          獲得バッジ
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((b, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded-2xl border transition flex items-center gap-3 ${
                b.unlocked 
                  ? 'bg-amber-50/70 border-amber-200 text-stone-800' 
                  : 'bg-stone-50 border-stone-200 opacity-50 grayscale'
              }`}
            >
              <div className="text-2xl">{b.icon}</div>
              <div>
                <h4 className="font-bold text-xs">{b.title}</h4>
                <p className="text-[10px] text-stone-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-600" />
            学習記録の履歴
          </h3>
          {studyLogs.length > 0 && (
            <button 
              onClick={onClearLogs}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> 記録を全消去
            </button>
          )}
        </div>

        {studyLogs.length === 0 ? (
          <div className="text-center py-8 text-stone-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-sm font-medium">まだ勉強記録がありません</p>
            <p className="text-xs text-stone-400">「タイマー」で勉強時間を計測して記録してみよう！</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {studyLogs.map(log => (
              <div key={log.id} className="p-3 bg-stone-50 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-stone-800 mr-2">{log.subject}</span>
                  <span className="text-stone-400">{log.timestamp}</span>
                </div>
                <span className="font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md border border-amber-200/60">
                  {log.minutes} 分間
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
