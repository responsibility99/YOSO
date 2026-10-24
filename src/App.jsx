import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

// 取得したFirebase設定キー
const firebaseConfig = {
  apiKey: "AIzaSyDqF4TO1a17kQNg3Peog161CoMQ5RpOPsg",
  authDomain: "yoso-67380.firebaseapp.com",
  projectId: "yoso-67380",
  storageBucket: "yoso-67380.firebasestorage.app",
  messagingSenderId: "91328892475",
  appId: "1:91328892475:web:fc5cf5a16433174648161e"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 指定の13教科リスト
const SUBJECTS = [
  "国語1", "国語２a", "国語２ｂ", 
  "歴史", "地理", 
  "数学Ａ", "数学Ｂ", 
  "化学", "生物", "地学", 
  "音楽", 
  "英語１", "英語２", 
  "その他"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('すべて');
  
  // プロフィール状態
  const [userProfile, setUserProfile] = useState({
    name: '中学1年生',
    icon: '🎓'
  });

  // 新規投稿状態
  const [newSubject, setNewSubject] = useState('国語1');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Firebaseからリアルタイムで問題一覧を取得
  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qArray = [];
      snapshot.forEach((doc) => {
        qArray.push({ id: doc.id, ...doc.data() });
      });
      setQuestions(qArray);
    });
    return () => unsubscribe();
  }, []);

  // 投稿処理
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await addDoc(collection(db, 'questions'), {
        subject: newSubject,
        title: newTitle,
        content: newContent,
        answer: newAnswer,
        author: userProfile.name,
        authorIcon: userProfile.icon,
        comments: [],
        createdAt: serverTimestamp()
      });

      setNewTitle('');
      setNewContent('');
      setNewAnswer('');
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("投稿に失敗しました。Databaseのルール設定（テストモード）を確認してください。");
    }
  };

  // 削除処理
  const handleDeleteQuestion = async (id) => {
    if (window.confirm("本当にこの投稿を削除しますか？")) {
      try {
        await deleteDoc(doc(db, 'questions', id));
      } catch (error) {
        console.error("削除エラー:", error);
      }
    }
  };

  const filteredQuestions = selectedSubject === 'すべて' 
    ? questions 
    : questions.filter(q => q.subject === selectedSubject);

  return (
    <div style={{ backgroundColor: '#FFFBEB', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#F59E0B', padding: '15px 20px', borderRadius: '12px', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>定期テスト予想問題</h1>
        <div>{userProfile.icon} <span>{userProfile.name}</span></div>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('questions')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'questions' ? '#D97706' : '#FDE68A', color: activeTab === 'questions' ? '#FFF' : '#78350F', fontWeight: 'bold', cursor: 'pointer' }}>問題一覧・投稿</button>
      </div>

      {activeTab === 'questions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* 投稿フォーム */}
          <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3>新規問題を投稿する</h3>
            <form onSubmit={handleAddQuestion}>
              <div style={{ marginBottom: '10px' }}>
                <label>科目:</label><br/>
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>タイトル:</label><br/>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="例: 定期テストの頻出問題" />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>問題文:</label><br/>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px', height: '80px' }} placeholder="問題をここに入力..." />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>解答・解説 (任意):</label><br/>
                <input type="text" value={newAnswer} onChange={e => setNewAnswer(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="答えをここに入力..." />
              </div>
              <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>投稿する</button>
            </form>
          </div>

          {/* 問題一覧 */}
          <div>
            <div style={{ marginBottom: '15px', display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '5px' }}>
              <button onClick={() => setSelectedSubject('すべて')} style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', background: selectedSubject === 'すべて' ? '#D97706' : '#FEF3C7', cursor: 'pointer' }}>すべて</button>
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => setSelectedSubject(s)} style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', background: selectedSubject === s ? '#D97706' : '#FEF3C7', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>

            {filteredQuestions.length === 0 ? (
              <p style={{ color: '#92400E', textAlign: 'center', marginTop: '40px' }}>投稿された問題がまだありません。</p>
            ) : (
              filteredQuestions.map(q => (
                <div key={q.id} style={{ backgroundColor: '#FFF', padding: '15px', borderRadius: '12px', marginBottom: '15px', position: 'relative' }}>
                  <button onClick={() => handleDeleteQuestion(q.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>削除</button>
                  <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{q.subject}</span>
                  <h4 style={{ margin: '8px 0' }}>{q.title}</h4>
                  <p style={{ margin: '5px 0' }}>{q.content}</p>
                  {q.answer && <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '6px', marginTop: '8px', color: '#065F46' }}>💡 答え: {q.answer}</div>}
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '10px' }}>投稿者: {q.authorIcon} {q.author}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
