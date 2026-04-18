/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Image as ImageIcon, Loader2, Copy, Check, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getPrompt = (lang: string, detailLevel: string) => `请对上传的图像进行深度逆向推导，生成一段逻辑清晰、细节丰富的长文本标注（Caption）。

请务必涵盖以下维度：
1. **画面构图与视角**：描述镜头角度（俯视/平视/特写）、构图方式（三分法/中心对称）。
2. **主体细节**：精确描述主体的外观、材质、颜色、动作、神态或纹理。
3. **环境与背景**：描述背景中的元素、天气、地理位置、室内外的装饰细节。
4. **光影与色彩**：分析光线来源（侧光/逆光）、光质（柔和/硬光）、主色调及色彩对比。
5. **艺术风格/器材感**：若是摄影，说明焦距感、景深；若是绘画，说明画风（赛博朋克、印象派、Ukiyo-e等）。

约束条件：
- 避免使用模糊的词汇（如“美丽的”、“一些”），使用具体的名词和形容词。
- 文本需具备连贯性，像是一段专业的文学描述，而非简单的标签堆砌。
- 输出语言 (Output Language)：${lang}。
- 长度要求：${detailLevel === 'detailed' ? '字数控制在 200-500 字左右，尽可能详尽专业。' : '字数控制在 100-200 字之间，用最凝练的语言概括核心信息。'}`;

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState('中文');
  const [detailLevel, setDetailLevel] = useState('detailed');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setCaption(''); // Reset caption when new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setCaption('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateCaption = async () => {
    if (!image) return;
    
    setIsGenerating(true);
    setCaption('');
    
    try {
      // Extract base64 data and mime type
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: getPrompt(language, detailLevel),
            },
          ],
        },
      });

      for await (const chunk of response) {
        if (chunk.text) {
          setCaption((prev) => prev + chunk.text);
        }
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      setCaption('生成失败，请重试。 (Error generating caption. Please try again.)');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-slate-900">Visual Asset Analyzer</h1>
          <p className="text-slate-500 text-lg">Upload an image to generate a highly detailed, professional caption.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Image Upload & Config */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-0">
                <div 
                  className={`relative group cursor-pointer aspect-square md:aspect-[4/3] flex flex-col items-center justify-center m-4 rounded-xl overflow-hidden transition-all border-2 border-dashed ${isDragging ? 'border-slate-800 bg-slate-100' : 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}`}
                  onClick={() => !image && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                  
                  {image ? (
                    <div className="relative w-full h-full group/image">
                      <img 
                        src={image} 
                        alt="Uploaded preview" 
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black text-white p-2 text-sm rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm"
                        title="Remove image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 p-6 pointer-events-none">
                      <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border transition-all ${isDragging ? 'border-slate-800 text-slate-800 scale-110' : 'border-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:scale-110'}`}>
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or GIF</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Configuration Panel */}
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Language</label>
                      <select 
                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        disabled={isGenerating}
                      >
                        <option value="中文">Chinese</option>
                        <option value="English">English</option>
                        <option value="日本語">Japanese</option>
                        <option value="Français">French</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detail Level</label>
                      <select 
                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
                        value={detailLevel}
                        onChange={(e) => setDetailLevel(e.target.value)}
                        disabled={isGenerating}
                      >
                        <option value="detailed">Detailed (200-500 words)</option>
                        <option value="concise">Concise (100-200 words)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-14 text-base rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
              onClick={generateCaption}
              disabled={!image || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Generate Detailed Caption
                </>
              )}
            </Button>
          </div>

          {/* Right Column: Result */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm rounded-2xl bg-white h-[calc(100%-4rem)] min-h-[400px] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-medium text-slate-900">Generated Analysis</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-500 hover:text-slate-900"
                  onClick={copyToClipboard}
                  disabled={!caption}
                >
                  {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <CardContent className="p-0 flex-1 relative">
                {caption ? (
                  <ScrollArea className="h-full absolute inset-0 text-left">
                    <div className="p-6 pb-12 markdown-body prose prose-sm sm:prose-base prose-slate max-w-none 
                      prose-headings:font-medium prose-headings:text-slate-900 
                      prose-p:text-slate-700 prose-p:leading-relaxed
                      prose-strong:text-slate-900 prose-strong:font-semibold">
                      <Markdown>{caption}</Markdown>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 p-6 text-center">
                    {isGenerating ? (
                      <div className="space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" />
                        <p className="text-sm">Performing deep visual analysis...</p>
                      </div>
                    ) : (
                      <p className="text-sm">Upload an image and click generate to see the analysis here.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

