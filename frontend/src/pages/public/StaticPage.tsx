import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

// Simple markdown-to-HTML (lightweight, no external dep needed)
function renderMarkdown(text: string): string {
  return text
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 mb-4 mt-8 first:mt-0">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-900 mb-3 mt-6">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="text-slate-600 mb-1">$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    .replace(/\n\n/g, '</p><p class="text-slate-600 mb-4 leading-relaxed">')
    .replace(/^(?!<[h|l])/gm, '');
}

export default function StaticPage({ slug }: { slug: string }) {
  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => api.get(`/public/pages/${slug}`).then(r => r.data.page),
    enabled: !!slug,
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-6" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-slate-100 rounded mb-2" />)}
    </div>
  );

  if (isError || !page) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-slate-500">Page not found.</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-12 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold">{page.title}</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 lg:p-12">
          <div
            className="prose max-w-none text-slate-600 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `<p class="text-slate-600 mb-4 leading-relaxed">${renderMarkdown(page.content)}</p>`
            }}
          />
        </div>
      </div>
    </div>
  );
}
