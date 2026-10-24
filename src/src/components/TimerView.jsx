import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Zap, Clock } from 'lucide-react';

const SUBJECTS = [
  '国語1', '国語２a', '国語２ｂ', '歴史', '地理', 
  '数学Ａ', '数学Ｂ', '化学', '生物', '地学', 
  '音楽', '英語１', '英語２'
];

export default function TimerView({ onSaveLog }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [subject, setSubject] = useState(SUBJECTS[0]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleFinish = () => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    onSaveLog({
      subject,
      minutes,
      timestamp: new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      dateISO: new Date().toISOString().split('T')[0]
    });
    setSeconds(0);
    setIsActive(false);
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return {
      m: String(mins).padStart(2, '0'),
      s: String(secs).padStart(2, '0')
    };
  };

  const { m, s } = formatTime(seconds);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-2 text-amber-100 font-bold text-xs uppercase tracking-wider">
          <Clock className="w-4 h-4" /> 集中タイマー
        </div>
        
        <div className="mb-4">
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="bg-white/20 backdrop-blur-md text-white font-bold text-sm px-4 py-2 rounded-xl outline-none cursor-pointer border border-white/30 text-center"
          >
            {SUBJECTS.map(s => <option key={s} value={s} className="text-stone-800">{s}</option>)}
          </select>
        </div>

        <div className="text-6xl font-black tracking-tight font-mono py-4 drop-shadow-md">
          {m}<span className="text-3xl opacity-80">:</span>{s}
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all ${
              isActive 
                ? 'bg-amber-100 text-amber-900 hover:bg-white' 
                : 'bg-white text-amber-700 hover:bg-amber-50'
            }`}
          >
            {isActive ? <><Pause className="w-4 h-4" /> 一時停止</> : <><Play className="w-4 h-4" /> スタート</>}
          </button>

          <button 
            onClick={() => { setSeconds(0); setIsActive(false); }}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-2xl backdrop-blur-md transition"
            title="リセット"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {seconds > 0 && (
          <button 
            onClick={handleFinish}
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition"
          >
            <CheckCircle className="w-4 h-4" /> 記録して終了する
          </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-3">
        <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
          <Zap className="w-6 h-6" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-stone-800">タイマーのヒント</p>
          <p className="text-stone-500 mt-0.5">25分集中して5分休憩するポモドーロテクニックが効率アップでおすすめ！</p>
        </div>
      </div>
    </div>
  );
}
