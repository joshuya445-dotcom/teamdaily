import React, { useState, useEffect } from 'react';
import { api } from '../services/mockBackend';
import { generateTeamSummary } from '../services/geminiService';
import { TeamSummary } from '../types';
import { Button } from '../components/Button';
import { Sparkles, AlertTriangle, Lightbulb, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';

export const Summary: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const existing = await api.summary.get(date);
      setSummary(existing);
    };
    load();
  }, [date]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const reports = await api.daily.list(date);
      if (reports.length === 0) {
        throw new Error("该日期暂无日报提交，无法生成总结。");
      }

      const aiData = await generateTeamSummary(reports, date);
      
      const newSummary = await api.summary.create({
        date,
        summaryAI: aiData.summary,
        riskAI: aiData.risks,
        recommendationsAI: aiData.recommendations,
        keywords: aiData.keywords
      });
      
      setSummary(newSummary);
    } catch (e: any) {
      setError(e.message || "生成总结失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    
    // Note: jsPDF default fonts don't support Chinese characters well without custom fonts.
    // For this demo, we will output basic ASCII or user would need to add a font.
    // We will keep English headers for PDF safety in this environment.
    
    doc.setFontSize(20);
    doc.text(`Team Summary - ${date}`, 20, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Executive Summary", 20, 40);
    doc.setFontSize(10);
    doc.setTextColor(0);
    const splitSummary = doc.splitTextToSize(summary.summaryAI, 170);
    doc.text(splitSummary, 20, 50);
    
    let y = 50 + (splitSummary.length * 5) + 10;
    
    doc.setFontSize(14);
    doc.setTextColor(200, 0, 0);
    doc.text("Key Risks", 20, y);
    doc.setFontSize(10);
    doc.setTextColor(0);
    const splitRisks = doc.splitTextToSize(summary.riskAI, 170);
    doc.text(splitRisks, 20, y + 10);

    y = y + 10 + (splitRisks.length * 5) + 10;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 200);
    doc.text("Recommendations", 20, y);
    doc.setFontSize(10);
    doc.setTextColor(0);
    const splitRecs = doc.splitTextToSize(summary.recommendationsAI, 170);
    doc.text(splitRecs, 20, y + 10);
    
    doc.save(`summary-${date}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="w-6 h-6 text-indigo-500 mr-2" />
            AI 智能总结
        </h1>
        <div className="flex items-center gap-3">
             <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Button onClick={handleGenerate} isLoading={isGenerating}>
                {summary ? '重新生成' : '一键生成总结'}
            </Button>
            {summary && (
                <Button variant="outline" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4" />
                </Button>
            )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
        </div>
      )}

      {!summary && !isGenerating && !error && (
         <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
             <div className="mx-auto h-12 w-12 text-gray-400">
                 <Sparkles />
             </div>
             <h3 className="mt-2 text-sm font-medium text-gray-900">暂无该日期的总结</h3>
             <p className="mt-1 text-sm text-gray-500">选择日期并点击生成，让 AI 帮您汇总团队进度。</p>
         </div>
      )}

      {summary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
           {/* Header */}
           <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
               <h2 className="text-2xl font-bold mb-2">团队报告: {summary.date}</h2>
               <div className="flex flex-wrap gap-2">
                   {summary.keywords.map(k => (
                       <span key={k} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                           {k}
                       </span>
                   ))}
               </div>
           </div>

           <div className="p-8 space-y-8">
               {/* Summary Section */}
               <section>
                   <div className="flex items-center gap-2 mb-4 text-gray-900">
                       <FileText className="w-5 h-5 text-indigo-600" />
                       <h3 className="text-lg font-bold">整体概况</h3>
                   </div>
                   <div className="prose prose-slate max-w-none text-gray-600 bg-gray-50 p-6 rounded-lg border border-gray-100 whitespace-pre-line">
                       {summary.summaryAI}
                   </div>
               </section>

               <div className="grid md:grid-cols-2 gap-8">
                   {/* Risks */}
                   <section>
                       <div className="flex items-center gap-2 mb-4 text-gray-900">
                           <AlertTriangle className="w-5 h-5 text-red-600" />
                           <h3 className="text-lg font-bold">风险与阻碍</h3>
                       </div>
                       <div className="prose prose-slate max-w-none text-gray-600 bg-red-50 p-6 rounded-lg border border-red-100 whitespace-pre-line">
                           {summary.riskAI}
                       </div>
                   </section>

                   {/* Recommendations */}
                   <section>
                       <div className="flex items-center gap-2 mb-4 text-gray-900">
                           <Lightbulb className="w-5 h-5 text-amber-500" />
                           <h3 className="text-lg font-bold">改进建议</h3>
                       </div>
                       <div className="prose prose-slate max-w-none text-gray-600 bg-amber-50 p-6 rounded-lg border border-amber-100 whitespace-pre-line">
                           {summary.recommendationsAI}
                       </div>
                   </section>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
