import PyPDF2
from typing import Optional
import io

class PDFExtractor:
    """Service for extracting text from PDF files"""
    
    @staticmethod
    def extract_text(pdf_file: bytes) -> Optional[str]:
        """
        Extract text content from a PDF file
        
        Args:
            pdf_file: PDF file content as bytes
            
        Returns:
            Extracted text as string, or None if extraction fails
        """
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
            text = ""
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            return text.strip() if text else None
            
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return None
    
    @staticmethod
    def get_page_count(pdf_file: bytes) -> int:
        """Get the number of pages in a PDF"""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
            return len(pdf_reader.pages)
        except:
            return 0
