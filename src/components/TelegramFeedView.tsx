import React from 'react';
import { Share2 } from 'lucide-react';

interface TelegramFeedItem {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

interface TelegramFeedViewProps {
  telegramFeed: TelegramFeedItem[];
}

export const TelegramFeedView: React.FC<TelegramFeedViewProps> = React.memo(({ telegramFeed }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3 shadow-md text-left">
      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
        <Share2 className="h-4 w-4 text-indigo-400" /> Virtual Announcement Feed
      </h4>
      <p className="text-[10px] text-slate-500 leading-normal">
        Live automated broad notifications published directly onto the Telegram channel logs in real-time.
      </p>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {telegramFeed.length === 0 ? (
          <p className="text-[9px] text-slate-500 font-mono text-center">No logs generated yet.</p>
        ) : (
          telegramFeed.map((feed) => (
            <div key={feed.id} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-900 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1">
                  📢 {feed.sender}
                </span>
                <span className="text-[8px] text-slate-500 font-mono">{feed.timestamp}</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">{feed.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

TelegramFeedView.displayName = 'TelegramFeedView';
