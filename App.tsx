import React, { useEffect, useMemo, useState } from 'react';
import { loadingWorkbenchImage } from './loadingWorkbenchImage';

type MixStrength = 'ほんのり' | '半分ずつ' | '大胆に' | '実験的' | '商用向けに整える';
type UseCase = 'SNS投稿' | '投稿表紙' | '記事ヘッダー' | 'エッセイ挿絵' | '解説カード' | '商品ポップ' | '紹介画像' | 'LPキービジュアル' | '印刷カード';
type RenderingType = 'デフォルメ' | 'イラスト寄り' | 'アニメ寄り' | 'セミリアル' | 'リアル寄り' | '写真風';
type AtmosphereType = 'おまかせ' | '朝の光' | '夕方の光' | '逆光' | 'やわらかい自然光' | '映画のような光' | 'スタジオ撮影風' | '雨上がり' | '冬の透明感' | '夏の湿度' | '夜のネオン';
type AspectRatio = '正方形 1:1' | '縦長投稿 4:5' | 'ストーリー 9:16' | '横長 16:9' | '記事ヘッダー 3:1' | 'A4縦 1:1.414';

const baseStyles = ['絵本', '大人の絵本', '漫画', '雑誌写真', '図解インフォグラフィック', '教材イラスト', '児童書カット', 'ポスターイラスト', 'ヴィンテージ挿絵', 'フラットイラスト', '淡彩ペン画'] as const;
const accentStyles = ['現代アート', '水彩', '民藝', '和紙', 'リソグラフ', '鉛筆スケッチ', 'クレヨン', '博物図鑑', 'レトロ印刷', '北欧', 'ミニマル', 'コラージュ', '夢日記', '古い教科書', 'デフォルメ線画'] as const;
const mixStrengths: MixStrength[] = ['ほんのり', '半分ずつ', '大胆に', '実験的', '商用向けに整える'];
const useCases: UseCase[] = ['SNS投稿', '投稿表紙', '記事ヘッダー', 'エッセイ挿絵', '解説カード', '商品ポップ', '紹介画像', 'LPキービジュアル', '印刷カード'];
const renderingTypes: RenderingType[] = ['デフォルメ', 'イラスト寄り', 'アニメ寄り', 'セミリアル', 'リアル寄り', '写真風'];
const textures = ['艶のあるタッチ', 'マットな質感', '透明感', 'やわらかい発光感', '高級感のある光沢', 'フィルム写真風', '淡い粒子感', 'なめらかなデジタルペイント', 'ざらっとした紙質感'] as const;
const atmosphereTypes: AtmosphereType[] = ['おまかせ', '朝の光', '夕方の光', '逆光', 'やわらかい自然光', '映画のような光', 'スタジオ撮影風', '雨上がり', '冬の透明感', '夏の湿度', '夜のネオン'];
const aspectRatios: AspectRatio[] = ['正方形 1:1', '縦長投稿 4:5', 'ストーリー 9:16', '横長 16:9', '記事ヘッダー 3:1', 'A4縦 1:1.414'];
const aspectRatioMap: Record<AspectRatio, string> = {
  '正方形 1:1': '1:1 square composition',
  '縦長投稿 4:5': '4:5',
  'ストーリー 9:16': '9:16',
  '横長 16:9': '16:9',
  '記事ヘッダー 3:1': '3:1',
  'A4縦 1:1.414': '1:1.414 portrait composition',
};
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
  'SNS投稿': 'Design for instant stop-scroll impact, square-friendly framing, and strong readability at first glance.',
  '投稿表紙': 'Compose as a clear series cover image where the theme is understood immediately and works across recurring posts.',
  '記事ヘッダー': 'Use a calm, wide-header composition with generous breathing space suitable for note, Substack, or blog intros.',
  'エッセイ挿絵': 'Create a quiet editorial illustration that supports prose tone and emotional nuance without overpowering the text.',
  '解説カード': 'Prioritize structured clarity for educational/explanatory content with clean grouping and easy visual scanning.',
  '商品ポップ': 'Build a bright, eye-catching composition for small business merchandising while preserving the product world and mood.',
  '紹介画像': 'Craft a polished modern introduction visual suitable for indie products, apps, or service overviews.',
  'LPキービジュアル': 'Deliver a strong first-impression hero composition that communicates brand world, subject focus, and narrative energy.',
  '印刷カード': 'Keep print-friendly balance with stable margins, legibility, and whitespace suitable for handout/card usage.',
};

const renderingTypeLeadMap: Record<RenderingType, string> = {
  'デフォルメ': 'Create a stylized illustration.',
  'イラスト寄り': 'Create a polished illustration.',
  'アニメ寄り': 'Create an anime-inspired illustration.',
  'セミリアル': 'Create a semi-realistic illustration.',
  'リアル寄り': 'Create a realistic-leaning illustration.',
  '写真風': 'Create a photorealistic editorial photograph. It must look like a real camera photo, not an illustration, not digital painting, not anime, not concept art.',
};

const baseStyleGuideMap: Partial<Record<(typeof baseStyles)[number], string>> = {
  '雑誌写真': 'Use a high-quality editorial magazine photograph style with real camera optics, natural lens depth, realistic material texture, plausible lighting, and no illustrated outlines. Treat this as photography first, not illustration.',
  '淡彩ペン画': 'Use thin delicate brown ink linework, fine uneven pen strokes, transparent watercolor wash, warm cream paper texture, subtle grain, deckled paper edges, and airy handmade stationery-like charm. Avoid thick outlines, bold cartoon contour, manga-like heavy linework, flat vector shapes, anime features, and heavy digital painting.',
};

const App: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [selectedAccents, setSelectedAccents] = useState<string[]>([]);
  const [mixStrength, setMixStrength] = useState<MixStrength>('半分ずつ');
  const [useCase, setUseCase] = useState<UseCase>('SNS投稿');
  const [selectedRenderingType, setSelectedRenderingType] = useState<RenderingType>('イラスト寄り');
  const [selectedTextures, setSelectedTextures] = useState<string[]>([]);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<AtmosphereType>('おまかせ');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('正方形 1:1');
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
    setSelectedRenderingType(renderingTypes[Math.floor(Math.random() * renderingTypes.length)]);
    setSelectedTextures(pick(textures, Math.floor(Math.random() * 2) + 1));
    setSelectedAtmosphere(atmosphereTypes[Math.floor(Math.random() * atmosphereTypes.length)]);
    setSelectedAspectRatio(aspectRatios[Math.floor(Math.random() * aspectRatios.length)]);
  };

  const toggleTexture = (texture: string) => {
    setSelectedTextures((prev) => (prev.includes(texture) ? prev.filter((t) => t !== texture) : prev.length >= 2 ? [...prev.slice(1), texture] : [...prev, texture]));
  };

  const finalPrompt = useMemo(() => {
    const effectiveRenderingType: RenderingType = selectedBases.includes('雑誌写真') ? '写真風' : selectedRenderingType;
    const lead = renderingTypeLeadMap[effectiveRenderingType];
    const baseLine = selectedBases.length ? selectedBases.join(' × ') : '（未選択）';
    const accentLine = selectedAccents.length ? selectedAccents.join(' × ') : '（未選択）';
    const baseStyleGuides = selectedBases.map((b) => baseStyleGuideMap[b as (typeof baseStyles)[number]]).filter(Boolean).join('\n');
    return `${lead}
Output type: single still image.
Subject: ${subject || '（題材を入力してください）'}
Use case: ${useCase}
Aspect ratio: ${aspectRatioMap[selectedAspectRatio]}
Base style(s): ${baseLine}
Rendering type: ${effectiveRenderingType}
Accent style(s): ${accentLine}
Texture: ${selectedTextures.length ? selectedTextures.join(' × ') : '（未選択）'}
Light and atmosphere: ${selectedAtmosphere}
Mix method: ${mixStrength}

Composition and spacing:
${useCaseMap[useCase]}
Keep stable margins and a clear focal hierarchy appropriate for the selected aspect ratio.

Style balance:
Base style defines the overall composition, visual structure, layout, and primary rendering method.
Accent style should influence texture, mood, decorative details, color feeling, and small visual surprises.
Do not let the accent style overpower the base style.
Blend them harmoniously into one coherent visual language.
Rendering type controls the degree of realism, stylization, and character detail.
Texture controls surface finish, brush feel, material impression, grain, gloss, and softness.
Light and atmosphere controls time of day, air, mood, shadow, and emotional temperature.
${mixStrengthMap[mixStrength]}
${baseStyleGuides}

Restrictions:
Avoid garbled text: do not render text inside the image by default.
If layout requires copy later, only leave clean empty space for text placement without drawing actual letters.
If Rendering type is photographic, do not create illustration, digital painting, anime, manga, cartoon, or drawn line art.`;
  }, [subject, selectedBases, selectedAccents, mixStrength, useCase, selectedRenderingType, selectedTextures, selectedAtmosphere, selectedAspectRatio]);

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
      const aspectRatio = aspectRatioMap[selectedAspectRatio].split(' ')[0];
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, aspectRatio }),
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
  const handleDownload = () => {
    if (!generatedImage) return;
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const name = `funiki-atelier-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.png`;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
          <p className="section-title with-icon"><img src="/assets/icon-base.svg" alt="" />ベーススタイル（最大2）</p>
          <p className="section-note">絵の骨格や見え方の方向性を決めます。</p>
          <div className="chip-grid">{baseStyles.map((s) => <button key={s} onClick={() => toggleBase(s)} className={chipClass(selectedBases.includes(s))}>{s}</button>)}</div>
        </section>

        <section className="card">
          <p className="section-title with-icon"><img src="/assets/icon-accent.svg" alt="" />アクセントスタイル（最大3）</p>
          <p className="section-note">質感・空気感・色・装飾のニュアンスを足します。</p>
          <div className="chip-grid">{accentStyles.map((s) => <button key={s} onClick={() => toggleAccent(s)} className={chipClass(selectedAccents.includes(s))}>{s}</button>)}</div>
        </section>

        <section className="grid-two">
          <div className="card">
            <p className="section-title with-icon"><img src="/assets/icon-mix.svg" alt="" />混ぜ方</p>
            <p className="section-note">どのくらい大胆に混ぜるかを決めます。</p>
            <div className="chip-grid">{mixStrengths.map((m) => <button key={m} onClick={() => setMixStrength(m)} className={chipClass(mixStrength === m)}>{m}</button>)}</div>
          </div>
          <div className="card">
            <p className="section-title with-icon"><img src="/assets/icon-usecase.svg" alt="" />用途</p>
            <p className="section-note">どこで見せる画像かを選び、余白・視認性・レイアウトの方向を整えます。</p>
            <div className="chip-grid">{useCases.map((u) => <button key={u} onClick={() => setUseCase(u)} className={chipClass(useCase === u)}>{u}</button>)}</div>
          </div>
        </section>
        <section className="card">
          <p className="section-title with-icon"><img src="/assets/icon-usecase.svg" alt="" />画像比率</p>
          <p className="section-note">投稿・記事・印刷に合わせて、構図の縦横比を整えます。</p>
          <p className="section-note">生成結果の比率に反映されます。</p>
          <div className="chip-grid">{aspectRatios.map((s) => <button key={s} onClick={() => setSelectedAspectRatio(s)} className={chipClass(selectedAspectRatio === s)}>{s}</button>)}</div>
        </section>
        <section className="grid-two">
          <div className="card">
            <p className="section-title with-icon"><img src="/assets/icon-rendering.svg" alt="" />描写タイプ（1つ）</p>
            <p className="section-note">写実度・キャラクターの立体感・描き込み量を調整します。</p>
            <div className="chip-grid">{renderingTypes.map((r) => <button key={r} onClick={() => setSelectedRenderingType(r)} className={chipClass(selectedRenderingType === r)}>{r}</button>)}</div>
          </div>
          <div className="card">
            <p className="section-title with-icon"><img src="/assets/icon-light.svg" alt="" />光・空気感（1つ）</p>
            <p className="section-note">時間帯や季節感、影と空気の温度感を決めます。</p>
            <div className="chip-grid">{atmosphereTypes.map((a) => <button key={a} onClick={() => setSelectedAtmosphere(a)} className={chipClass(selectedAtmosphere === a)}>{a}</button>)}</div>
          </div>
        </section>
        <section className="card">
          <p className="section-title with-icon"><img src="/assets/icon-texture.svg" alt="" />質感（最大2）</p>
          <p className="section-note">表面の質感・色の乗り方・光沢・粒子・紙感に効かせます。</p>
          <div className="chip-grid">{textures.map((t) => <button key={t} onClick={() => toggleTexture(t)} className={chipClass(selectedTextures.includes(t))}>{t}</button>)}</div>
        </section>

        <div className="action-row">
          <button onClick={randomizeCombo} className="sub-button with-icon"><img src="/assets/icon-random.svg" alt="" />今日の変な組み合わせ</button>
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
        {isLoading && (
          <div className="result-placeholder">
            <img
              src={loadingWorkbenchImage}
              alt="雰囲気を調合している作業台"
              className="loading-illustration"
              onError={(e) => {
                e.currentTarget.src = '/assets/loading-workbench.svg';
              }}
            />
            <p>雰囲気を調合中です</p>
            <p>作業台で、選んだ素材をあれこれ混ぜています。</p>
          </div>
        )}
        {!isLoading && !generatedImage && (
          <div className="result-placeholder">
            <img src="/assets/empty-preview.svg" alt="生成前プレビュー" className="result-image" />
            <p>まだ名前のない絵を待っています。</p>
          </div>
        )}
        {generatedImage && (
          <>
            <img src={generatedImage} alt="generated" className="result-image" />
            <button onClick={handleDownload} className="download-button">画像をダウンロード</button>
          </>
        )}
      </div>
    </main>
  );
};

export default App;
