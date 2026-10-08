import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import Tesseract from 'tesseract.js';

export async function extractTextFromFile(buffer, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text.trim();
    } else if (mimetype.startsWith('image/')) {
      const { data: { text } } = await Tesseract.recognize(
        buffer,
        'eng',
        // Optional logger to track progress
        // { logger: m => console.log(m) } 
      );
      return text.trim();
    } else {
      throw new Error("Unsupported file type. Only PDFs and images are supported.");
    }
  } catch (e) {
    console.error("Extraction error:", e);
    throw new Error("Failed to extract text: " + e.message);
  }
}
