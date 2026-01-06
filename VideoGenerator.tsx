
import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import type { ImageForEditing } from '../App';

// Removed conflicting global declaration for window.aistudio to fix type error.
// Access to window.aistudio will be handled via type assertion.

interface VideoGeneratorProps {
    imageToAnimate: ImageForEditing | null;
    onAnimationComplete: () => void;
}

const FilmIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ imageToAnimate, onAnimationComplete }) => {
    const [prompt, setPrompt] = useState<string>('A cinematic, slow-motion shot of the scene coming to life');
    const [activeImage, setActiveImage] = useState<ImageForEditing | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);

    useEffect(() => {
        if (imageToAnimate) {
            setActiveImage(imageToAnimate);
            setError(null);
            setGeneratedVideo(null);
        }
    }, [imageToAnimate]);

    useEffect(() => {
        const checkApiKey = async () => {
            const aistudio = (window as any).aistudio;
            if (aistudio?.hasSelectedApiKey) {
                const hasKey = await aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio?.openSelectKey) {
            try {
                await aistudio.openSelectKey();
                setHasApiKey(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError(null);
            try {
                const { base64, mimeType } = await fileToBase64(file);
                const newImage = { url: URL.createObjectURL(file), base64, mimeType };
                setActiveImage(newImage);
                setGeneratedVideo(null);
            } catch (err) {
                setError("画像の読み込みに失敗しました。");
            }
        }
    };

    const handleGenerate = async () => {
        if (!activeImage || !prompt) return;

        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);
        
        try {
            const videoUrl = await generateVideo(
                prompt,
                activeImage.base64,
                activeImage.mimeType,
                aspectRatio,
                (msg) => setProgressMessage(msg)
            );
            setGeneratedVideo(videoUrl);
            onAnimationComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : "動画生成中にエラーが発生しました。");
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };

    if (!hasApiKey) {
         return (
            <Card>
                 <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-100 mb-6">
                        <FilmIcon />
                    </div>
                    <h3 className="text-xl font-bold text-stone-700">動画をつくる準備</h3>
                    <p className="mt-2 text-stone-500 max-w-md mx-auto">
                        高品質な動画モデル (Veo) を使うには、APIキーの選択が必要です。
                    </p>
                    <div className="mt-8">
                        <Button onClick={handleSelectKey} icon={<FilmIcon />}>
                            APIキーを選んでスタート
                        </Button>
                    </div>
                    <p className="mt-6 text-xs text-stone-400">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">
                            料金設定について
                        </a>
                    </p>
                </div>
            </Card>
         );
    }

    return (
        <Card>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-stone-700">絵を動かす</h2>
                <p className="mt-2 text-stone-500">
                    静止画に命を吹き込みます。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2 pl-2">1. 画像を選ぶ</label>
                         {!activeImage ? (
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-64 px-4 py-6 border-2 border-stone-200 border-dashed rounded-[2rem] text-stone-400 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all bg-stone-50">
                                <UploadIcon />
                                <span className="mt-2 font-bold">クリックして画像を選ぶ</span>
                                <span className="text-xs mt-1">作成タブで作った絵も使えます</span>
                                <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                            </label>
                        ) : (
                            <div className="relative group">
                                <img src={activeImage.url} alt="Animation Source" className="w-full h-auto rounded-[1.5rem] border border-stone-100 shadow-sm" />
                                <button 
                                    onClick={() => { setActiveImage(null); setGeneratedVideo(null); }}
                                    className="absolute top-2 right-2 bg-white text-rose-500 p-2 rounded-full shadow-md hover:bg-rose-50 transition-colors"
                                    title="削除"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="video-prompt" className="block text-sm font-bold text-stone-700 mb-2 pl-2">2. どんな風に？</label>
                        <textarea
                            id="video-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-4 border-2 border-stone-200 rounded-[1.5rem] focus:ring-4 focus:ring-rose-100 focus:border-rose-300 transition duration-300 ease-out text-base bg-stone-50"
                            rows={2}
                            placeholder="例：カメラがゆっくりとズームインする..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2 pl-2">3. 形を選ぶ</label>
                        <div className="flex space-x-4">
                             <label className={`flex-1 cursor-pointer p-4 border-2 rounded-2xl flex items-center justify-center space-x-2 transition-all ${aspectRatio === '16:9' ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-sm' : 'hover:bg-stone-50 border-stone-200 text-stone-500'}`}>
                                <input type="radio" name="aspect" value="16:9" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} className="sr-only" />
                                <span className="font-bold">よこなが (16:9)</span>
                            </label>
                             <label className={`flex-1 cursor-pointer p-4 border-2 rounded-2xl flex items-center justify-center space-x-2 transition-all ${aspectRatio === '9:16' ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-sm' : 'hover:bg-stone-50 border-stone-200 text-stone-500'}`}>
                                <input type="radio" name="aspect" value="9:16" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} className="sr-only" />
                                <span className="font-bold">たてなが (9:16)</span>
                            </label>
                        </div>
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        isLoading={isLoading} 
                        disabled={!activeImage || !prompt || isLoading} 
                        className="w-full py-4 text-lg shadow-xl shadow-rose-200" 
                        icon={<FilmIcon />}
                    >
                        動画をつくる
                    </Button>
                    
                    {isLoading && (
                        <div className="text-center p-6 bg-stone-50 rounded-[2rem] border-2 border-stone-100 border-dashed">
                            <Spinner className="mx-auto mb-3 text-rose-400" />
                            <p className="text-sm font-bold text-stone-500 animate-pulse">{progressMessage}</p>
                        </div>
                    )}

                    {error && <p className="text-rose-600 bg-rose-50 p-4 rounded-2xl border border-rose-200 font-bold text-center">{error}</p>}
                </div>

                <div className="flex flex-col items-center justify-center bg-stone-50 rounded-[2rem] border-4 border-white shadow-inner min-h-[300px] p-6 overflow-hidden">
                    {generatedVideo ? (
                         <div className="w-full h-full flex flex-col items-center">
                            <video 
                                src={generatedVideo} 
                                controls 
                                autoPlay 
                                loop 
                                className="max-w-full max-h-[500px] rounded-2xl shadow-lg bg-black"
                            />
                            <a 
                                href={generatedVideo} 
                                download="generated-video.mp4" 
                                className="mt-6 text-rose-500 hover:text-rose-600 font-bold flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-rose-100 hover:shadow-md transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                保存する
                            </a>
                        </div>
                    ) : (
                        <div className="text-center text-stone-300">
                            <p className="font-bold">ここに動画ができます</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default VideoGenerator;
