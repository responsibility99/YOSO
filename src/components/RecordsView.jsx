import React from 'react';
import { BarChart2, TrendingUp, Award, Trash2 } from 'lucide-react';

export default function RecordsView({ studyLogs, onClearLogs }) {
  const totalMinutes = studyLogs.reduce((sum, log) => sum + (log.minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // 科目ごとの集計
  const subjectTotals = studyLogs.reduce((acc, log) => {
    acc[log.subject] = (acc[log.subject] || 0) + log.minutes;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-600" /> 学習分析・記録
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">これまでの積み重ねをチェックしよう！</p>
        </div>
        {studyLogs.length > 0 && (
          <button 
            onClick={onClearLogs}
            className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> 記録リセット
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 rounded-2xl shadow-sm text-center">
          <span className="text-xs text-amber-100 font-semibold">合計勉強時間</span>
          <p className="text-2xl font-black mt-1">{totalHours} <span className="text-xs font-normal">時間</span></p>
          <span className="text-[10px] text-amber-100">({totalMinutes} 分)</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm text-center flex flex-col justify-center">
          <span className="text-xs text-stone-500 font-semibold">達成セッション</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{studyLogs.length} <span className="text-xs font-normal text-stone-500">回</span></p>
        </div>
      </div>

      {Object.keys(subjectTotals).length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-600" /> 科目別グラフ
          </h3>
          <div className="space-y-2">
            {Object.entries(subjectTotals).map(([sub, mins]) => {
              const percent = Math.min(100, Math.round((mins / (totalMinutes || 1)) * 100));
              return (
                <div key={sub} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-stone-700">
                    <span>{sub}</span>
                    <span>{mins} 分 ({percent}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-600" /> 最近の勉強履歴
        </h3>

        {studyLogs.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-6">まだ記録がありません。タイマーを使って学習を始めましょう！</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {studyLogs.map((log, index) => (
              <div key={log.id || index} className="p-3 bg-stone-50 rounded-xl flex justify-between items-center text-xs border border-stone-100">
                <div>
                  <span className="font-bold text-stone-800">{log.subject}</span>
                  <p className="text-[10px] text-stone-400 mt-0.5">{log.timestamp}</p>
                </div>
                <span className="font-extrabold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                  {log.minutes} 分
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
