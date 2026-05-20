import React, { useMemo, useState } from 'react';

type MixStrength = 'ほんのり' | '半分ずつ' | '大胆に' | '実験的' | '商用向けに整える';
type UseCase = 'SNS投稿' | 'サムネイル' | 'Substackヘッダー' | '4コマ表紙' | '解説カード' | '商品ポップ' | 'LINEスタンプ' | 'アプリ紹介画像' | 'A4印刷';

const baseStyles = ['絵本', '図解インフォグラフィック', '漫画', '雑誌挿絵', '商品ポップ', 'パッケージデザイン', '教材イラスト', 'ポスター', 'Webアプリ紹介画像', '児童書カット'] as const;
const accentStyles = ['現代アート', '水彩', '民藝', '和紙', 'リソグラフ', '鉛筆スケッチ', 'クレヨン', '博物図鑑', 'レトロ印刷', '北欧', 'ミニマル', 'コラージュ', '夢日記', '古い教科書', 'デフォルメ線画'] as const;
const mixStrengths: MixStrength[] = ['ほんのり', '半分ずつ', '大胆に', '実験的', '商用向けに整える'];
const useCases: UseCase[] = ['SNS投稿', 'サムネイル', 'Substackヘッダー', '4コマ表紙', '解説カード', '商品ポップ', 'LINEスタンプ', 'アプリ紹介画像', 'A4印刷'];

const mixStrengthMap: Record<MixStrength, string> = {
  'ほんのり': 'Apply the accent style subtly, only as mood, texture, and decorative detail.',
  '半分ずつ': 'Balance the selected base and accent styles evenly while keeping the image coherent.',
  '大胆に': 'Fuse the selected styles boldly and create a visually striking result.',
  '実験的': 'Create an unexpected, original hybrid style while preserving readability.',
  '商用向けに整える': 'Refine the mixed style into a polished, clean, usable commercial visual.',
};

const useCaseMap: Record<UseCase, string> = {
  'SNS投稿': 'Square-friendly composition with strong focal point and high instant readability. Keep optional text-safe breathing room.',
  'サムネイル': 'Design for small-size visibility with clear silhouette and contrast. Keep a clean zone for title overlay if needed.',
  'Substackヘッダー': 'Wide horizontal composition, calm rhythm, and clear negative space for headline placement.',
  '4コマ表紙': 'Simple panel-like framing, expressive subject, and clear hierarchy readable at a glance.',
  '解説カード': 'Card-like composition with structured spacing and visual clarity for educational context.',
  '商品ポップ': 'Commercial product-forward composition, bright attention cues, and reserved area for pricing/copy.',
  'LINEスタンプ': 'Bold contour, simplified forms, and strong legibility on small screens.',
  'アプリ紹介画像': 'Clean product-marketing composition with polished balance and modern visual language.',
  'A4印刷': 'Print-friendly layout, balanced margins, and medium-distance readability.',
};

const App: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [selectedAccents, setSelectedAccents] = useState<string[]>([]);
  const [mixStrength, setMixStrength] = useState<MixStrength>('半分ずつ');
  const [useCase, setUseCase] = useState<UseCase>('SNS投稿');
  const [openPreview, setOpenPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleBase = (style: string) => {
    setSelectedBases((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : prev.length >= 2 ? [...prev.slice(1), style] : [...prev, style]));
  };

  const toggleAccent = (style: string) => {
    setSelectedAccents((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : prev.length >= 3 ? [...prev.slice(1), style] : [...prev, style]));
  };

  const randomizeCombo = () => {
    const pick = <T,>(arr: readonly T[], count: number): T[] => [...arr].sort(() => Math.random() - 0.5).slice(0, count);
    setSelectedBases(pick(baseStyles, 1));
    setSelectedAccents(pick(accentStyles, Math.floor(Math.random() * 2) + 2));
    setMixStrength(mixStrengths[Math.floor(Math.random() * mixStrengths.length)]);
    setUseCase(useCases[Math.floor(Math.random() * useCases.length)]);
  };

  const finalPrompt = useMemo(() => {
    const baseLine = selectedBases.length ? selectedBases.join(' × ') : '（未選択）';
    const accentLine = selectedAccents.length ? selectedAccents.join(' × ') : '（未選択）';
    return `Subject: ${subject || '（題材を入力してください）'}
Base style(s): ${baseLine}
Accent style(s): ${accentLine}
Mix method: ${mixStrength}
Use case: ${useCase}

Base style defines the overall composition, visual structure, layout, and primary rendering method.
Accent style should influence texture, mood, decorative details, color feeling, and small visual surprises.
Do not let the accent style overpower the base style.
Blend them harmoniously into one coherent visual language.

${mixStrengthMap[mixStrength]}
${useCaseMap[useCase]}
Avoid garbled text: do not render text inside the image by default.
If layout requires copy later, only leave clean empty space for text placement without drawing actual letters.`;
  }, [subject, selectedBases, selectedAccents, mixStrength, useCase]);

  const canGenerate = subject.trim().length > 0 && selectedBases.length > 0 && selectedAccents.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setError(null);
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
    } catch {
      setError('生成に失敗しました。しばらくしてから再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const chipClass = (active: boolean) =>
    `px-3 py-2 rounded-full border text-sm ${active ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-300'}`;

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-stone-800">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">雰囲気調合室</h1>
          <p className="text-stone-600">まだ名前のない絵の雰囲気を探す、小さな画像生成アトリエ。</p>
        </header>

        <section className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
          <label className="font-semibold">題材</label>
          <textarea value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full min-h-28 border border-stone-300 rounded-xl p-3" placeholder="例: カラフルトマトの商品ポップ / Substack用ヘッダー画像 など" />
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
          <p className="font-semibold">ベーススタイル（最大2）</p>
          <div className="flex flex-wrap gap-2">{baseStyles.map((s) => <button key={s} onClick={() => toggleBase(s)} className={chipClass(selectedBases.includes(s))}>{s}</button>)}</div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
          <p className="font-semibold">アクセントスタイル（最大3）</p>
          <div className="flex flex-wrap gap-2">{accentStyles.map((s) => <button key={s} onClick={() => toggleAccent(s)} className={chipClass(selectedAccents.includes(s))}>{s}</button>)}</div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <p className="font-semibold">混ぜ方</p>
            <div className="flex flex-wrap gap-2">{mixStrengths.map((m) => <button key={m} onClick={() => setMixStrength(m)} className={chipClass(mixStrength === m)}>{m}</button>)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <p className="font-semibold">用途</p>
            <div className="flex flex-wrap gap-2">{useCases.map((u) => <button key={u} onClick={() => setUseCase(u)} className={chipClass(useCase === u)}>{u}</button>)}</div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button onClick={randomizeCombo} className="px-4 py-3 rounded-xl border border-stone-300 bg-white font-semibold">今日の変な組み合わせ</button>
          <button onClick={() => setOpenPreview((v) => !v)} className="px-4 py-3 rounded-xl border border-stone-300 bg-white font-semibold">プロンプトを見る</button>
          <button onClick={handleGenerate} disabled={!canGenerate || isLoading} className="px-6 py-3 rounded-xl bg-rose-500 text-white font-bold disabled:opacity-40">{isLoading ? '生成中...' : 'この雰囲気で生成'}</button>
        </div>

        {openPreview && <pre className="bg-stone-900 text-stone-100 text-xs p-4 rounded-2xl whitespace-pre-wrap">{finalPrompt}</pre>}
        {error && <p className="text-red-600">{error}</p>}
        {generatedImage && <img src={generatedImage} alt="generated" className="w-full rounded-2xl border border-stone-200" />}
      </div>
    </main>
  );
};

export default App;
