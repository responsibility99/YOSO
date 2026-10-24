import React, { useState } from 'react';

function App() {
  const [subject, setSubject] = useState('国語1');
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('すべて');

  const subjects = [
    '国語1', '国語2a', '国語2b', '歴史', '地理', 
    '数学A', '数学B', '化学', '生物', '地学', 
    '音楽', '英語1', '英語2', 'その他'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !question) return;
    const newPost = { id: Date.now(), subject, title, question, answer };
    setPosts([newPost, ...posts]);
    setTitle('');
    setQuestion('');
    setAnswer('');
  };

  const filteredPosts = selectedCategory === 'すべて' 
    ? posts 
    : posts.filter(p => p.subject === selectedCategory);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      {/* ヘッダー */}
      <header style={{ backgroundColor: '#e69138', color: '#fff', padding: '15px 20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>定期テスト予想問題</h1>
        <span style={{ fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '5px' }}>🎓 中学1年生</span>
      </header>

      {/* メインコンテンツ（PCは横並び / スマホは縦並び） */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
        
        {/* 投稿フォームエリア */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#fff9e6', padding: '20px', borderRadius: '10px', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#d97706' }}>新規問題を投稿する</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>科目:</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>タイトル:</label>
              <input type="text" placeholder="例: 定期テスト予想" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>問題文:</label>
              <textarea placeholder="問題をここに入力..." value={question} onChange={(e) => setQuestion(e.target.value)} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>解答・解説 (任意):</label>
              <textarea placeholder="答えを入力..." value={answer} onChange={(e) => setAnswer(e.target.value)} rows="2" style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ backgroundColor: '#e69138', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>投稿する</button>
          </form>
        </div>

        {/* 問題一覧エリア */}
        <div style={{ flex: '2 1 300px', boxSizing: 'border-box' }}>
          {/* 科目フィルタータブ */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px' }}>
            <button onClick={() => setSelectedCategory('すべて')} style={{ backgroundColor: selectedCategory === 'すべて' ? '#d97706' : '#fef3c7', color: selectedCategory === 'すべて' ? '#fff' : '#92400e', border: 'none', padding: '6px 12px', borderRadius: '15px', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>すべて</button>
            {subjects.map(s => (
              <button key={s} onClick={() => setSelectedCategory(s)} style={{ backgroundColor: selectedCategory === s ? '#d97706' : '#fef3c7', color: selectedCategory === s ? '#fff' : '#92400e', border: 'none', padding: '6px 12px', borderRadius: '15px', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>{s}</button>
            ))}
          </div>

          {/* 投稿一覧 */}
          {filteredPosts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>投稿された問題がまだありません。</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredPosts.map(post => (
                <div key={post.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{post.subject}</span>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{post.title}</h3>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{post.question}</p>
                  {post.answer && (
                    <details style={{ marginTop: '10px', fontSize: '0.85rem', color: '#555', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '5px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>解答・解説を見る</summary>
                      <p style={{ marginTop: '5px', marginBottom: 0, whiteSpace: 'pre-wrap' }}>{post.answer}</p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
