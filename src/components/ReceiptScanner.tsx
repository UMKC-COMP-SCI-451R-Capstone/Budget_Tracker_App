import React, { useRef, useState } from 'react';
import { createWorker, ImageLike } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, Loader2 } from 'lucide-react';
import { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type ReceiptScannerProps = {
  onScanComplete: (data: {
    amount?: string;
    date?: string;
    description?: string;
    account_id?: string;
  }) => void;
};

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scannedText, setScannedText] = useState('');

  const processImage = async (imageData: string | ArrayBuffer): Promise<string> => {
    try {
      // @ts-expect-error - Tesseract.js types are incomplete and missing worker methods
      const worker = await createWorker('eng');
      // @ts-expect-error - Tesseract.js types are incomplete and missing loadLanguage method
      await worker.loadLanguage('eng');
      // @ts-expect-error - Tesseract.js types are incomplete and missing initialize method
      await worker.initialize('eng');
      
      // Configure Tesseract for better receipt recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$/- ',
        tessedit_pageseg_mode: '6', // Assume uniform text block
        tessjs_create_pdf: '0',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0',
      });

      const { data: { text } } = await worker.recognize(imageData as ImageLike);
      await worker.terminate();
      return text;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image. Please try again or upload a clearer image.');
    }
  };

  const processPDF = async (file: File): Promise<string> => {
    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Create a Uint8Array from the ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 5); // Limit to first 5 pages for performance

      // Process each page
      for (let i = 1; i <= maxPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Extract text from the page
          const pageText = textContent.items
            .map((item: TextItem | TextMarkedContent) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

          if (pageText) {
            fullText += pageText + '\n';
          }
        } catch (pageError) {
          console.error(`Error processing page ${i}:`, pageError);
          // Continue with next page if one fails
          continue;
        }
      }

      if (!fullText.trim()) {
        throw new Error('No text content found in the PDF. The file might be scanned or image-based.');
      }

      return fullText;
    } catch (error) {
      console.error('Error processing PDF:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF structure')) {
          throw new Error('Invalid PDF file. Please make sure the file is not corrupted.');
        } else if (error.message.includes('No text content found')) {
          throw new Error('No text content found in the PDF. The file might be scanned or image-based.');
        }
      }
      throw new Error('Failed to process PDF file. Please try again or upload a different file.');
    }
  };

  const findAmount = (text: string): string | null => {
    const patterns = [
      /total[\s:]*\$?\s*(\d+\.?\d*)/i,
      /amount[\s:]*\$?\s*(\d+\.?\d*)/i,
      /\btotal\b.*?\$\s*(\d+\.?\d*)/i,
      /\$\s*(\d+\.?\d*)\s*$/m,
      /\$\s*(\d+\.?\d*)/,
      /(\d+\.?\d*)\s*(?:USD|EUR|GBP)/i,
      /(?:USD|EUR|GBP)\s*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*(?:total|amount)/i,
      /(?:total|amount)\s*(\d+\.?\d*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = parseFloat(match[1]);
        if (!isNaN(amount) && amount > 0) {
          return amount.toFixed(2);
        }
      }
    }

    const numbers = text.match(/\$?\s*(\d+\.?\d*)/g);
    if (numbers) {
      const amounts = numbers
        .map(n => parseFloat(n.replace(/\$/, '')))
        .filter(n => !isNaN(n) && n > 0);
      if (amounts.length > 0) {
        const maxAmount = Math.max(...amounts);
        return maxAmount.toFixed(2);
      }
    }

    return null;
  };

  const findDate = (text: string): string | null => {
    const datePatterns = [
      /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/,
      /\d{4}[-/]\d{1,2}[-/]\d{1,2}/,
      /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2},? \d{4}/i,
      /\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }

    return null;
  };

  const findDescription = (text: string): string | null => {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => 
        line.length > 3 && 
        !line.match(/^(total|amount|date|time|tel|fax|receipt|invoice|#|no\.|thank|welcome|subtotal|tax|discount)/i) &&
        !line.match(/^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/) &&
        !line.match(/^\$?\d+\.\d{2}$/) &&
        !line.match(/^\d+\.\d{2}$/)
      );

    return lines[0] || null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setError('');
    setScannedText('');

    try {
      let text: string;

      if (file.type === 'application/pdf') {
        text = await processPDF(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const imageData = await new Promise<string | ArrayBuffer>((resolve, reject) => {
          reader.onload = () => resolve(reader.result!);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        text = await processImage(imageData);
      } else {
        throw new Error('Unsupported file type. Please upload an image or PDF file.');
      }

      setScannedText(text);

      const extractedData = {
        amount: findAmount(text) || undefined,
        date: findDate(text) || undefined,
        description: findDescription(text) || undefined,
      };

      // Only call onScanComplete if we found at least one piece of data
      if (extractedData.amount || extractedData.date || extractedData.description) {
        onScanComplete(extractedData);
      } else {
        setError('No relevant information found in the receipt. Please try again or enter details manually.');
      }
    } catch (err) {
      console.error('Scanning error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan receipt. Please try again or enter details manually.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,.pdf"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="inline-flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {scanning ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
          <span className="ml-2 text-sm font-medium">
            {scanning ? 'Scanning receipt...' : 'Upload Receipt for Scanning'}
          </span>
        </button>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Supports JPG, PNG images and PDF files
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {scannedText && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Scanned Text</h3>
          <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{scannedText}</pre>
        </div>
      )}
    </div>
  );
}