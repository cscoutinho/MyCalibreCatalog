import React, { useMemo } from 'react';
import { Book } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BookOpen, Users, Languages, FileType, Hash, PenTool } from 'lucide-react';
import { getTagColor } from '../utils/colors';

interface DashboardProps {
  books: Book[];
  onTagClick: (tag: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ books, onTagClick }) => {
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const authorSet = new Set<string>();
    const langCounts: Record<string, number> = {};
    const formatCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    books.forEach(book => {
      // Authors
      book.authors.split('&').forEach(a => {
        const clean = a.trim();
        if (clean) {
            authorSet.add(clean);
            authorCounts[clean] = (authorCounts[clean] || 0) + 1;
        }
      });
      
      // Languages
      const langs = book.languages ? book.languages.split(',') : ['Unknown'];
      langs.forEach(l => {
        const lang = l.trim();
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      });

      // Formats
      book.formats.forEach(f => {
        const fmt = f.trim().toLowerCase();
        formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
      });

      // Tags
      book.tags.forEach(t => {
          const tag = t.trim();
          if (tag) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
      });
    });

    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const topFormats = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
    
    // Process top 50 tags for the cloud
    const topTagsList = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60);
      
    const maxTagCount = topTagsList.length > 0 ? topTagsList[0][1] : 1;
    const topTags = topTagsList.map(([name, value]) => ({
        name,
        value,
        // Calculate font size relative to max, between 0.85rem and 2rem
        sizeScale: 0.85 + (value / maxTagCount) * 1.5
    }));

    return {
      totalBooks,
      totalAuthors: authorSet.size,
      topLanguages,
      topFormats,
      topAuthors,
      topTags
    };
  }, [books]);

  // Color Palettes
  const COLORS_AUTHORS = ['#d97706', '#b45309', '#92400e', '#78350f']; // Amber tones
  const COLORS_LANGS = ['#0d9488', '#0f766e', '#115e59', '#134e4a']; // Teal tones
  const COLORS_FORMATS = ['#ca8a04', '#a16207', '#854d0e', '#713f12']; // Gold tones

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-stone-950 custom-scrollbar">
      <div className="mb-8 border-b border-stone-800 pb-4">
          <h2 className="text-4xl font-serif font-bold text-stone-100">Library Overview</h2>
          <p className="text-stone-500 mt-2 font-serif italic">Statistics and insights from your collection</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KpiCard icon={<BookOpen className="text-amber-500" />} label="Total Books" value={stats.totalBooks} />
        <KpiCard icon={<Users className="text-stone-400" />} label="Total Authors" value={stats.totalAuthors} />
        <KpiCard icon={<Languages className="text-teal-500" />} label="Languages" value={stats.topLanguages.length} />
        <KpiCard icon={<FileType className="text-yellow-600" />} label="File Formats" value={stats.topFormats.length} />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Top Authors */}
        <div className="bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-3">
             <PenTool className="w-5 h-5 text-amber-500" />
             <h3 className="text-xl font-serif font-semibold text-stone-200">Top Authors</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topAuthors} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#78716c" 
                    width={100} 
                    tick={{ fontSize: 12, fontFamily: 'var(--font-sans)' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#e7e5e4', fontFamily: 'var(--font-serif)' }}
                  cursor={{ fill: '#292524' }}
                />
                <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]}>
                    {stats.topAuthors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_AUTHORS[index % COLORS_AUTHORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Languages */}
        <div className="bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-3">
            <Languages className="w-5 h-5 text-teal-500" />
            <h3 className="text-xl font-serif font-semibold text-stone-200">Top Languages</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topLanguages} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#78716c" width={50} tick={{ fontFamily: 'var(--font-sans)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#e7e5e4', fontFamily: 'var(--font-serif)' }}
                  cursor={{ fill: '#292524' }}
                />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]}>
                    {stats.topLanguages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_LANGS[index % COLORS_LANGS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formats Pie Chart */}
        <div className="lg:col-span-1 bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-3">
            <FileType className="w-5 h-5 text-yellow-600" />
            <h3 className="text-xl font-serif font-semibold text-stone-200">Format Distribution</h3>
          </div>
          <div className="h-64 flex-1">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topFormats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.topFormats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_FORMATS[index % COLORS_FORMATS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#e7e5e4', fontFamily: 'var(--font-serif)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
              {stats.topFormats.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm text-stone-400">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_FORMATS[index % COLORS_FORMATS.length] }}></div>
                      <span className="font-mono">{entry.name.toUpperCase()}</span>
                  </div>
              ))}
          </div>
        </div>

        {/* Tag Cloud */}
        <div className="lg:col-span-2 bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-xl">
           <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-3">
             <Hash className="w-5 h-5 text-stone-500" />
             <h3 className="text-xl font-serif font-semibold text-stone-200">Trending Tags</h3>
           </div>
           
           <div className="flex flex-wrap gap-3 items-baseline justify-center p-4 min-h-[250px] content-start bg-stone-950/30 rounded-lg inner-shadow">
             {stats.topTags.map((tag) => {
               const colors = getTagColor(tag.name);
               return (
                <button
                    key={tag.name}
                    onClick={() => onTagClick(tag.name)}
                    className={`transition-all duration-300 hover:scale-105 cursor-pointer px-3 py-1 rounded-full font-sans border ${colors.bg} ${colors.text} ${colors.border} hover:brightness-125`}
                    style={{ 
                        fontSize: `${tag.sizeScale * 0.9}rem`,
                        opacity: 0.9,
                    }}
                    title={`${tag.name}: ${tag.value} books`}
                >
                    #{tag.name}
                </button>
               )
             })}
             {stats.topTags.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-stone-600 w-full">
                    <p>No tags found in this library.</p>
                </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-lg flex items-center gap-4 hover:bg-stone-800/80 transition-colors group">
    <div className="p-4 bg-stone-950 rounded-lg border border-stone-800 group-hover:border-stone-700 transition-colors">
      {React.isValidElement(icon) 
        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
            className: "w-8 h-8 " + ((icon as React.ReactElement<{ className?: string }>).props.className || "") 
          }) 
        : icon
      }
    </div>
    <div>
      <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-serif font-bold text-stone-200">{value.toLocaleString()}</p>
    </div>
  </div>
);
