'use client';

import React, { useState, useEffect } from 'react';
import { PollData, PollOption } from '@/types';
import { getVotedPollOption, setVotedPollOption } from '@/lib/privacy';
import { BarChart2, Check, CheckCircle2, ChevronRight, Lock, Eye, AlertCircle } from 'lucide-react';

interface ThreadPollProps {
  threadId: string;
  poll: PollData;
  onPollUpdated?: (updatedPoll: PollData) => void;
  compact?: boolean;
}

export default function ThreadPoll({
  threadId,
  poll: initialPoll,
  onPollUpdated,
  compact = false,
}: ThreadPollProps) {
  const [poll, setPoll] = useState<PollData>(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check if current device has already voted in this poll
  useEffect(() => {
    const votedId = getVotedPollOption(threadId);
    if (votedId !== null) {
      setVotedOptionId(votedId);
      setShowResults(true);
    }
  }, [threadId]);

  // Synchronize when initialPoll changes
  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  // Find the highest voted option for highlighting
  const maxVotes = Math.max(...poll.options.map((o) => o.votes || 0), 0);

  const handleVoteSubmit = async () => {
    if (selectedOptionId === null || isVoting) return;
    setIsVoting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/threads/${threadId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: selectedOptionId }),
      });

      const data = await res.json();
      if (res.ok && data.poll) {
        setPoll(data.poll);
        setVotedOptionId(selectedOptionId);
        setVotedPollOption(threadId, selectedOptionId);
        setShowResults(true);
        if (onPollUpdated) {
          onPollUpdated(data.poll);
        }
      } else {
        setErrorMsg(data.error || 'ไม่สามารถบันทึกการโหวตได้');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsVoting(false);
    }
  };

  const hasVoted = votedOptionId !== null;

  return (
    <div className="w-full my-3 bg-black/40 border border-white/[0.08] hover:border-white/[0.12] rounded-xl p-3.5 sm:p-4 text-xs transition-colors shadow-sm">
      {/* Poll Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 flex items-center justify-center shrink-0">
            <BarChart2 size={13} />
          </div>
          <span className="font-mono font-bold text-yellow-400 text-xs tracking-wide">
            โพลสำรวจความคิดเห็น (Poll)
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 tabular-nums">
          <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
            {poll.total_votes || 0} โหวต
          </span>
          {poll.closed && (
            <span className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/30 font-semibold">
              ปิดโหวตแล้ว
            </span>
          )}
        </div>
      </div>

      {/* Poll Question (if provided) */}
      {poll.question && (
        <p className="font-semibold text-zinc-100 text-xs sm:text-sm mb-3 leading-snug">
          {poll.question}
        </p>
      )}

      {errorMsg && (
        <div className="mb-3 p-2 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-1.5">
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Voting View vs Results View */}
      {!showResults && !hasVoted && !poll.closed ? (
        <div className="space-y-2">
          <div className="space-y-1.5">
            {poll.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5 active:scale-[0.99] ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-500/10 text-yellow-300 shadow-sm'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-200 hover:border-white/[0.12]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-400 text-zinc-950'
                        : 'border-zinc-500'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                  </div>
                  <span className="font-medium text-xs break-words">{option.text}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowResults(true)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 px-1 py-0.5 rounded transition-colors"
            >
              <Eye size={12} />
              <span>ดูผลโหวต</span>
            </button>

            <button
              type="button"
              disabled={selectedOptionId === null || isVoting}
              onClick={handleVoteSubmit}
              className="btn-primary !py-1.5 !px-4 text-xs font-semibold"
            >
              <Check size={13} />
              <span>{isVoting ? 'กำลังบันทึก...' : 'ลงคะแนนโหวต'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-2">
          <div className="space-y-2">
            {poll.options.map((option) => {
              const total = poll.total_votes || 0;
              const pct = total > 0 ? Math.round(((option.votes || 0) / total) * 100) : 0;
              const isUserChoice = votedOptionId === option.id;
              const isWinning = maxVotes > 0 && option.votes === maxVotes;

              return (
                <div
                  key={option.id}
                  className={`relative overflow-hidden rounded-lg border p-2.5 transition-all ${
                    isUserChoice
                      ? 'border-yellow-500/40 bg-yellow-500/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  {/* Visual Progress Bar Fill */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                      isWinning ? 'bg-gradient-to-r from-yellow-500/25 to-amber-500/20' : 'bg-white/[0.05]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />

                  {/* Option Content Row */}
                  <div className="relative flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {isUserChoice && (
                        <CheckCircle2 size={13} className="text-yellow-400 shrink-0" />
                      )}
                      <span className={`font-medium break-words ${isWinning ? 'text-zinc-100 font-semibold' : 'text-zinc-300'}`}>
                        {option.text}
                      </span>
                      {isUserChoice && (
                        <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.2 rounded border border-yellow-500/25 shrink-0">
                          ที่คุณเลือก
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-xs tabular-nums text-right shrink-0">
                      <span className={`font-bold ${isWinning ? 'text-yellow-400' : 'text-zinc-300'}`}>
                        {pct}%
                      </span>
                      <span className="text-zinc-500 text-[10px] ml-1.5">
                        ({option.votes || 0})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1 text-[10px]">
              <Lock size={10} className="text-zinc-400" />
              <span>การลงคะแนนแบบนิรนาม 100% (Zero-Log)</span>
            </div>

            {!hasVoted && !poll.closed && (
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="text-yellow-400 hover:underline flex items-center gap-0.5"
              >
                <span>กลับไปโหวต</span>
                <ChevronRight size={11} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
