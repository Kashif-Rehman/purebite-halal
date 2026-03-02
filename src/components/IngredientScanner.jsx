import React, { useMemo, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, X, Loader, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Map app language codes to Tesseract language codes
const getTesseractLang = (appLang) => {
  const langMap = {
    en: 'eng', es: 'spa', de: 'deu', fr: 'fra', it: 'ita', pt: 'por',
    ar: 'ara', ru: 'rus', tr: 'tur', pl: 'pol', nl: 'nld', sv: 'swe',
    da: 'dan', fi: 'fin', no: 'nor', el: 'ell', cs: 'ces', hu: 'hun',
    ro: 'ron', uk: 'ukr', bg: 'bul', sr: 'srp', hi: 'hin', bn: 'ben',
    id: 'ind', ms: 'msa', th: 'tha', vi: 'vie', ur: 'urd'
  };
  return langMap[appLang] || 'eng';
};

export default function IngredientScanner({ onClose, onAnalyze }) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrError, setOcrError] = useState('');

  const canAnalyze = useMemo(() => text.trim().length > 0 && !isProcessing, [text, isProcessing]);

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setOcrError('');

    try {
      // Use multi-language OCR: current app language + English fallback
      const currentLang = getTesseractLang(i18n.language);
      const ocrLangs = currentLang === 'eng' ? 'eng' : `${currentLang}+eng`;
      
      const { data } = await Tesseract.recognize(file, ocrLangs);
      const scannedText = String(data?.text || '').trim();
      if (!scannedText) {
        setOcrError(t('scanner.noTextFound', { defaultValue: 'No readable text found. Try another photo.' }));
      } else {
        setText(prev => (prev ? `${prev}\n${scannedText}` : scannedText));
      }
    } catch (error) {
      console.error('OCR failed:', error);
      setOcrError(t('scanner.ocrFailed', { defaultValue: 'Unable to read text from image. You can paste ingredients manually.' }));
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(17, 24, 39, 0.65)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} /> {t('scanner.ingredientsScanTitle', { defaultValue: 'Scan Ingredients' })}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: '0 0 12px 0', color: '#4b5563', fontSize: '14px' }}>
          {t('scanner.ingredientsScanHint', { defaultValue: 'Take a clear photo of the ingredients list, or paste text manually.' })}
        </p>

        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#059669',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '10px',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.7 : 1,
          marginBottom: '12px'
        }}>
          {isProcessing ? <Loader size={16} className="spin" /> : <Camera size={16} />}
          {isProcessing
            ? t('scanner.processingImage', { defaultValue: 'Reading image...' })
            : t('scanner.uploadImage', { defaultValue: 'Upload / Capture Ingredients Photo' })}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelected}
            disabled={isProcessing}
            style={{ display: 'none' }}
          />
        </label>

        {ocrError && (
          <p style={{ margin: '0 0 12px 0', color: '#b45309', fontSize: '13px' }}>
            ⚠️ {ocrError}
          </p>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('scanner.ingredientsTextareaPlaceholder', { defaultValue: 'Paste or edit ingredients text here...' })}
          style={{
            width: '100%',
            minHeight: '180px',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
            padding: '12px',
            fontSize: '14px',
            color: '#111827',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            onClick={onClose}
            style={{
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: 'pointer'
            }}
          >
            {t('about.close', { defaultValue: 'Close' })}
          </button>
          <button
            onClick={() => onAnalyze(text)}
            disabled={!canAnalyze}
            style={{
              border: 'none',
              background: canAnalyze ? '#059669' : '#9ca3af',
              color: 'white',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: canAnalyze ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            {t('scanner.analyzeIngredients', { defaultValue: 'Analyze Ingredients' })}
          </button>
        </div>
      </div>
    </div>
  );
}
