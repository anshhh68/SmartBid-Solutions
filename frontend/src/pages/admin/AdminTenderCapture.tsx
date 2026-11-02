import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Bookmark, ClipboardPaste, Download, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { buildCaptureBookmarklet } from '../../lib/portalCapture';

type CapturedRow = { title: string; ref: string; tenderId: string; closing: string; published: string; org: string; value: string };
type Batch = { pageUrl: string; rows: CapturedRow[] };

const STORAGE_KEY = 'smartbid-capture-batches';

function loadBatches(): Batch[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

const isCapture = (d: any): d is Batch & { type: string } =>
  d?.type === 'smartbid-capture' && typeof d.pageUrl === 'string' && Array.isArray(d.rows);

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export default function AdminTenderCapture() {
  const queryClient = useQueryClient();
  const bookmarkRef = useRef<HTMLAnchorElement>(null);
  const [batches, setBatches] = useState<Batch[]>(loadBatches);
  const [pasteText, setPasteText] = useState('');

  // Result pages of form-based portals share one address, so merge rows instead of replacing
  const addBatch = (batch: Batch) => {
    setBatches((prev) => {
      const old = prev.find((b) => b.pageUrl === batch.pageUrl)?.rows || [];
      const byKey = new Map([...old, ...batch.rows].map((r) => [r.tenderId || r.ref || r.title, r]));
      return [...prev.filter((b) => b.pageUrl !== batch.pageUrl), { pageUrl: batch.pageUrl, rows: [...byKey.values()] }];
    });
    toast.success(`Received ${batch.rows.length} tenders from ${hostOf(batch.pageUrl)}`);
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
    } catch {
      /* storage unavailable — batches just won't survive a reload */
    }
  }, [batches]);

  useEffect(() => {
    // React blocks javascript: URLs in JSX, so set the bookmark link directly
    bookmarkRef.current?.setAttribute('href', buildCaptureBookmarklet(window.location.origin));

    // Only accept rows from the portal tab that opened this window
    const onMessage = (e: MessageEvent) => {
      if (e.source === window.opener && isCapture(e.data)) addBatch(e.data);
    };
    window.addEventListener('message', onMessage);
    window.opener?.postMessage('smartbid-capture-ready', '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const importMutation = useMutation({
    mutationFn: async () => {
      const messages: string[] = [];
      for (const b of batches) {
        const res = await api.post('/admin/tenders/capture', b, { timeout: 60000 });
        messages.push(res.data.message);
      }
      return messages;
    },
    onSuccess: (messages) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
      messages.forEach((m) => toast.success(m));
      setBatches([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Import failed'),
  });

  const handlePaste = () => {
    try {
      const data = JSON.parse(pasteText);
      if (!isCapture(data)) throw new Error();
      addBatch(data);
      setPasteText('');
    } catch {
      toast.error('That is not captured tender data. Click the bookmark on the portal page first.');
    }
  };

  const total = batches.reduce((n, b) => n + b.rows.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/tenders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to tenders
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Capture Tenders from Portals</h1>
        <p className="text-sm text-slate-500 mt-1">
          For CPPP, IREPS and state e-procurement portals, which need a login or captcha and can't be synced automatically.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">One-time setup</h2>
        <p className="text-sm text-slate-600 mb-3">Drag this button to your browser's bookmarks bar:</p>
        <a
          ref={bookmarkRef}
          onClick={(e) => {
            e.preventDefault();
            toast('Drag this button to your bookmarks bar, then click it on a portal page.');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold cursor-grab shadow-sm"
        >
          <Bookmark className="w-4 h-4" /> Send to SmartBid
        </a>

        <h2 className="font-semibold text-slate-900 mt-6 mb-2">Each time</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-600">
          <li>Stay logged in to this admin panel in this browser.</li>
          <li>Open the portal (e.g. eprocure.gov.in, ireps.gov.in, mahatenders.gov.in), log in or enter the captcha as usual, and open a tender list.</li>
          <li>Click <b>Send to SmartBid</b> in your bookmarks bar. This page opens with the tenders. Repeat for more pages or portals.</li>
          <li>Check the preview below and click <b>Import</b>.</li>
        </ol>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-900">Captured ({total} tenders)</h2>
          <button
            onClick={() => importMutation.mutate()}
            disabled={total === 0 || importMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {importMutation.isPending ? 'Importing...' : `Import ${total} tenders`}
          </button>
        </div>

        {batches.length === 0 && (
          <p className="text-sm text-slate-500">Nothing captured yet. Click the bookmark on a portal's tender list.</p>
        )}

        {batches.map((b) => (
          <div key={b.pageUrl} className="mb-5 border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 text-sm">
              <span className="font-medium text-slate-700">{hostOf(b.pageUrl)} · {b.rows.length} tenders</span>
              <button
                onClick={() => setBatches((prev) => prev.filter((x) => x.pageUrl !== b.pageUrl))}
                className="text-slate-400 hover:text-red-600"
                aria-label="Remove this batch"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Tender ID / Ref</th>
                    <th className="px-4 py-2">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {b.rows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-800">{r.title}</td>
                      <td className="px-4 py-2 text-slate-500">{r.tenderId || r.ref}</td>
                      <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{r.closing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.rows.length > 8 && <p className="px-4 py-2 text-xs text-slate-400">…and {b.rows.length - 8} more</p>}
            </div>
          </div>
        ))}

        <details className="mt-2">
          <summary className="text-sm text-slate-500 cursor-pointer">Bookmark didn't open this page? Paste instead</summary>
          <p className="text-xs text-slate-500 mt-2">The bookmark also copies the tenders to your clipboard. Paste them here:</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            className="w-full mt-2 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            placeholder='{"type":"smartbid-capture", ...}'
          />
          <button
            onClick={handlePaste}
            className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm"
          >
            <ClipboardPaste className="w-4 h-4" /> Add pasted tenders
          </button>
        </details>
      </div>
    </div>
  );
}
