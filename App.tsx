import React, { useEffect, useMemo, useState } from 'react';

type MixStrength = 'ほんのり' | '半分ずつ' | '大胆に' | '実験的' | '商用向けに整える';
type UseCase = 'SNS投稿' | 'サムネイル' | 'Substackヘッダー' | '4コマ表紙' | '解説カード' | '商品ポップ' | 'LINEスタンプ' | 'アプリ紹介画像' | 'A4印刷';

const baseStyles = ['絵本', '図解インフォグラフィック', '漫画', '雑誌挿絵', '商品ポップ', 'パッケージデザイン', '教材イラスト', 'ポスター', 'Webアプリ紹介画像', '児童書カット'] as const;
const accentStyles = ['現代アート', '水彩', '民藝', '和紙', 'リソグラフ', '鉛筆スケッチ', 'クレヨン', '博物図鑑', 'レトロ印刷', '北欧', 'ミニマル', 'コラージュ', '夢日記', '古い教科書', 'デフォルメ線画'] as const;
const mixStrengths: MixStrength[] = ['ほんのり', '半分ずつ', '大胆に', '実験的', '商用向けに整える'];
const useCases: UseCase[] = ['SNS投稿', 'サムネイル', 'Substackヘッダー', '4コマ表紙', '解説カード', '商品ポップ', 'LINEスタンプ', 'アプリ紹介画像', 'A4印刷'];
const USAGE_KEY = 'atelier-daily-generate-usage';
const dailyLimit = 3;

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
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) {
      localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      setUsageCount(0);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed.date !== today) {
        localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setUsageCount(0);
      } else {
        setUsageCount(Math.max(0, Number(parsed.count) || 0));
      }
    } catch {
      localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      setUsageCount(0);
    }
  }, []);

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

  const remainingCount = Math.max(0, dailyLimit - usageCount);
  const isLimitReached = remainingCount <= 0;
  const canGenerate = subject.trim().length > 0 && selectedBases.length > 0 && selectedAccents.length > 0 && !isLimitReached;
  const disabledReason = !subject.trim()
    ? '題材を入力すると生成できます。'
    : selectedBases.length === 0
    ? 'ベーススタイルを1つ以上選ぶと生成できます。'
    : selectedAccents.length === 0
    ? 'アクセントスタイルを1つ以上選ぶと生成できます。'
    : isLimitReached
    ? '本日の無料生成回数（3回）に達しました。'
    : '';

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
      const today = new Date().toISOString().slice(0, 10);
      const nextCount = usageCount + 1;
      setUsageCount(nextCount);
      localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: nextCount }));
    } catch {
      setError('生成に失敗しました。しばらくしてから再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const chipClass = (active: boolean) => `chip ${active ? 'is-active' : ''}`;

  return (
    <main className="atelier-page">
      <div className="atelier-shell">
        <header className="hero">
          <h1><img src="/assets/icon-bottle.svg" alt="" className="hero-icon" />雰囲気調合室<img src="/assets/icon-spark.svg" alt="" className="hero-icon" /></h1>
          <p>まだ名前のない絵の雰囲気を探す、小さな画像生成アトリエ。</p>
          <div className="hero-tools">
            <img src="/assets/icon-palette.svg" alt="" />
            <img src="/assets/icon-bottle.svg" alt="" />
            <img src="/assets/icon-spark.svg" alt="" />
          </div>
        </header>

        <section className="card">
          <label className="section-title">題材</label>
          <p className="section-note">作りたい情景や用途を、メモのように自由に書いてください。</p>
          <textarea value={subject} onChange={(e) => setSubject(e.target.value)} className="subject-input" placeholder={"例:\n田植えをする人\n育児中の母の限界\nカラフルトマトの商品ポップ\nSubstack用のヘッダー画像"} />
        </section>

        <section className="card">
          <p className="section-title">ベーススタイル（最大2）</p>
          <p className="section-note">構図・画面設計・主な描画方法を決めます。</p>
          <div className="chip-grid">{baseStyles.map((s) => <button key={s} onClick={() => toggleBase(s)} className={chipClass(selectedBases.includes(s))}>{s}</button>)}</div>
        </section>

        <section className="card">
          <p className="section-title">アクセントスタイル（最大3）</p>
          <p className="section-note">質感・空気感・色・装飾のニュアンスを足します。</p>
          <div className="chip-grid">{accentStyles.map((s) => <button key={s} onClick={() => toggleAccent(s)} className={chipClass(selectedAccents.includes(s))}>{s}</button>)}</div>
        </section>

        <section className="grid-two">
          <div className="card">
            <p className="section-title">混ぜ方</p>
            <p className="section-note">どのくらい大胆に混ぜるかを決めます。</p>
            <div className="chip-grid">{mixStrengths.map((m) => <button key={m} onClick={() => setMixStrength(m)} className={chipClass(mixStrength === m)}>{m}</button>)}</div>
          </div>
          <div className="card">
            <p className="section-title">用途</p>
            <p className="section-note">見せる場所に合う視認性・余白・レイアウトを調整します。</p>
            <div className="chip-grid">{useCases.map((u) => <button key={u} onClick={() => setUseCase(u)} className={chipClass(useCase === u)}>{u}</button>)}</div>
          </div>
        </section>

        <div className="action-row">
          <button onClick={randomizeCombo} className="sub-button">今日の変な組み合わせ</button>
          <button onClick={() => setOpenPreview((v) => !v)} className="sub-button">プロンプトを見る</button>
        </div>

        {openPreview && (
          <section className="card">
            <div className="preview-head">
              <p className="section-title">生成プロンプト</p>
              <button
                className="sub-button"
                onClick={() => navigator.clipboard?.writeText(finalPrompt)}
              >
                コピー
              </button>
            </div>
            <div className="framed-surface">
              <img src="/assets/card-frame.svg" alt="" className="frame-overlay" />
              <pre className="prompt-preview">{finalPrompt}</pre>
            </div>
          </section>
        )}

        <section className="generate-zone">
          <button onClick={handleGenerate} disabled={!canGenerate || isLoading} className="primary-button">{isLoading ? '生成中...' : 'この雰囲気で生成'}</button>
          <p className="disabled-note">本日の無料生成: {usageCount}/{dailyLimit}（残り {remainingCount} 回）</p>
          {!canGenerate && <p className="disabled-note">{disabledReason}</p>}
          {error && <p className="error-note">{error}</p>}
        </section>
        {!generatedImage && (
          <div className="result-placeholder">
            <img src="/assets/empty-preview.svg" alt="生成前プレビュー" className="result-image" />
            <p>まだ名前のない絵を待っています。</p>
          </div>
        )}
        {generatedImage && <img src={generatedImage} alt="generated" className="result-image" />}
      </div>
    </main>
  );
};

export default App;
