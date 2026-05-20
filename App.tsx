import React, { useEffect, useMemo, useState } from 'react';

type MixStrength = 'ほんのり' | '半分ずつ' | '大胆に' | '実験的' | '商用向けに整える';
type UseCase = 'SNS投稿' | '投稿表紙' | '記事ヘッダー' | 'エッセイ挿絵' | '解説カード' | '商品ポップ' | '紹介画像' | 'LPキービジュアル' | '印刷カード';
type AtmosphereType = 'おまかせ' | '朝の光' | '夕方の光' | '逆光' | 'やわらかい自然光' | '映画のような光' | 'スタジオ撮影風' | '雨上がり' | '冬の透明感' | '夏の湿度' | '夜のネオン';

const baseStyles = ['絵本', '大人の絵本', '漫画', '雑誌挿絵', '図解インフォグラフィック', '教材イラスト', '児童書カット', 'ポスターイラスト', 'ヴィンテージ挿絵', 'フラットイラスト', 'バンドデシネ風', '実写投稿風'] as const;
const accentStyles = ['現代アート', '水彩', '民藝', '和紙', 'リソグラフ', '鉛筆スケッチ', 'クレヨン', '博物図鑑', 'レトロ印刷', '北欧', 'ミニマル', 'コラージュ', '夢日記', '古い教科書', 'デフォルメ線画'] as const;
const mixStrengths: MixStrength[] = ['ほんのり', '半分ずつ', '大胆に', '実験的', '商用向けに整える'];
const useCases: UseCase[] = ['SNS投稿', '投稿表紙', '記事ヘッダー', 'エッセイ挿絵', '解説カード', '商品ポップ', '紹介画像', 'LPキービジュアル', '印刷カード'];
const textures = ['艶のあるタッチ', 'マットな質感', '透明感', 'やわらかい発光感', '高級感のある光沢', 'フィルム写真風', '淡い粒子感', 'なめらかなデジタルペイント', 'ざらっとした紙質感'] as const;
const atmosphereTypes: AtmosphereType[] = ['おまかせ', '朝の光', '夕方の光', '逆光', 'やわらかい自然光', '映画のような光', 'スタジオ撮影風', '雨上がり', '冬の透明感', '夏の湿度', '夜のネオン'];
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

const baseStyleMap: Partial<Record<string, string>> = {
  '実写投稿風': 'Create a social-media-ready photorealistic image with natural camera perspective, realistic lighting, believable depth of field, lifelike materials, natural shadows, photographic color grading, and a composition suitable for posts or article thumbnails. Prioritize real-world plausibility over illustration. Avoid cartoon outlines, flat vector shapes, and storybook stylization unless another selected style intentionally softens the result.',
  'バンドデシネ風': 'Use a European bande dessinée inspired visual language with mature comic composition, refined vintage mood, hand-drawn line character, and editorial warmth.',
  'フラットイラスト': 'Use simplified flat illustration structure, clear silhouettes, minimal depth, tidy color blocks, and high readability for communication design.',
  'ヴィンテージ挿絵': 'Use a nostalgic editorial illustration mood with aged print charm, restrained palette, subtle paper texture, and classic composition.',
  '大人の絵本': 'Use a gentle storybook atmosphere with mature restraint, refined composition, quiet emotion, and soft handmade warmth.',
};

const accentStyleMap: Partial<Record<string, string>> = {
  'クレヨン': 'Use visible wax crayon strokes, uneven hand pressure, rough paper grain, layered waxy pigments, imperfect edges, soft broken lines, and tactile handmade marks. Avoid clean digital brushwork or smooth vector-like coloring.',
  '水彩': 'Use transparent watercolor washes, soft bleeding, layered pigment, gentle color blooms, visible paper texture, and airy edges.',
  '鉛筆スケッチ': 'Use graphite pencil lines, subtle shading, sketch marks, hand-drawn contour variation, and visible paper tooth.',
  'リソグラフ': 'Use risograph-like limited colors, slight ink misregistration, grainy print texture, flat overlapping inks, and retro print charm.',
  'レトロ印刷': 'Use aged print texture, limited palette, slight ink offset, faded tones, halftone-like imperfections, and vintage paper feel.',
  'デフォルメ線画': 'Use simplified line drawing, rounded forms, reduced detail, expressive contours, and friendly readability.',
};

const textureMap: Partial<Record<string, string>> = {
  '艶のあるタッチ': 'Add glossy highlights, smooth reflective surfaces, luminous color depth, and polished finish without becoming plastic.',
  'マットな質感': 'Use soft non-reflective surfaces, muted highlights, gentle color absorption, and calm tactile finish.',
  '透明感': 'Add translucent color layers, airy light, soft clarity, and delicate depth.',
  'やわらかい発光感': 'Use gentle glow, soft bloom, warm luminous edges, and dreamy light diffusion.',
  '高級感のある光沢': 'Use refined controlled highlights, elegant material shine, premium color depth, and sophisticated contrast.',
  'フィルム写真風': 'Use analog film grain, soft contrast, natural color cast, slight imperfection, and nostalgic photographic texture.',
  '淡い粒子感': 'Use subtle grain, delicate speckles, soft noise, and tactile atmospheric texture.',
  'なめらかなデジタルペイント': 'Use smooth painterly blending, clean gradients, refined brush control, and polished digital illustration finish.',
  'ざらっとした紙質感': 'Use rough paper grain, visible fibers, dry pigment catch, and tactile handmade surface.',
};

const App: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [selectedAccents, setSelectedAccents] = useState<string[]>([]);
  const [mixStrength, setMixStrength] = useState<MixStrength>('半分ずつ');
  const [useCase, setUseCase] = useState<UseCase>('SNS投稿');
  const [selectedTextures, setSelectedTextures] = useState<string[]>([]);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<AtmosphereType>('おまかせ');
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
    setSelectedTextures(pick(textures, Math.floor(Math.random() * 2) + 1));
    setSelectedAtmosphere(atmosphereTypes[Math.floor(Math.random() * atmosphereTypes.length)]);
  };

  const toggleTexture = (texture: string) => {
    setSelectedTextures((prev) => (prev.includes(texture) ? prev.filter((t) => t !== texture) : prev.length >= 2 ? [...prev.slice(1), texture] : [...prev, texture]));
  };

  const finalPrompt = useMemo(() => {
    const baseLine = selectedBases.length ? selectedBases.join(' × ') : '（未選択）';
    const accentLine = selectedAccents.length ? selectedAccents.join(' × ') : '（未選択）';
    const baseGuidance = selectedBases.map((style) => baseStyleMap[style]).filter(Boolean).join('\n');
    const accentGuidance = selectedAccents.map((style) => accentStyleMap[style]).filter(Boolean).join('\n');
    const textureGuidance = selectedTextures.map((texture) => textureMap[texture]).filter(Boolean).join('\n');

    return `Subject: ${subject || '（題材を入力してください）'}
Base style(s): ${baseLine}
Accent style(s): ${accentLine}
Mix method: ${mixStrength}
Use case: ${useCase}
Texture: ${selectedTextures.length ? selectedTextures.join(' × ') : '（未選択）'}
Light and atmosphere: ${selectedAtmosphere}

Base style defines the overall composition, visual structure, layout, and primary rendering method.
Accent style should influence texture, mood, decorative details, color feeling, and small visual surprises.
Do not let the accent style overpower the base style.
Blend them harmoniously into one coherent visual language.
Texture controls surface finish, brush feel, material impression, grain, gloss, and softness.
Light and atmosphere controls time of day, air, mood, shadow, and emotional temperature.

${mixStrengthMap[mixStrength]}
${useCaseMap[useCase]}
${baseGuidance ? `\nDetailed base style guidance:\n${baseGuidance}` : ''}
${accentGuidance ? `\nDetailed accent guidance:\n${accentGuidance}` : ''}
${textureGuidance ? `\nDetailed texture guidance:\n${textureGuidance}` : ''}
Avoid garbled text: do not render text inside the image by default.
If layout requires copy later, only leave clean empty space for text placement without drawing actual letters.`;
  }, [subject, selectedBases, selectedAccents, mixStrength, useCase, selectedTextures, selectedAtmosphere]);

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
          <p className="section-note">絵の骨格や見え方の方向性を決めます。</p>
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
            <p className="section-note">どこで見せる画像かを選び、余白・視認性・レイアウトの方向を整えます。</p>
            <div className="chip-grid">{useCases.map((u) => <button key={u} onClick={() => setUseCase(u)} className={chipClass(useCase === u)}>{u}</button>)}</div>
          </div>
        </section>
        <section className="grid-two">
          <div className="card">
            <p className="section-title">光・空気感（1つ）</p>
            <p className="section-note">時間帯や季節感、影と空気の温度感を決めます。</p>
            <div className="chip-grid">{atmosphereTypes.map((a) => <button key={a} onClick={() => setSelectedAtmosphere(a)} className={chipClass(selectedAtmosphere === a)}>{a}</button>)}</div>
          </div>
          <div className="card">
            <p className="section-title">質感（最大2）</p>
            <p className="section-note">表面の質感・色の乗り方・光沢・粒子・紙感に効かせます。</p>
            <div className="chip-grid">{textures.map((t) => <button key={t} onClick={() => toggleTexture(t)} className={chipClass(selectedTextures.includes(t))}>{t}</button>)}</div>
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
