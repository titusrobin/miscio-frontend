// src/utils/formatters.ts
export const formatOpenAIResponse = (content: string): string => {
    if (!content) return '';
    
    return content
      // Handle bold formatting with double asterisks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Handle bullet points with numbering
      .replace(/^\d+\.\s/gm, '<br/>$&')
      
      // Handle citation references in square brackets
      .replace(/\[(.*?)\]/g, (match, citation) => {
        // If it's a citation like [12:1†OneStop.txt], make it less intrusive
        if (citation.includes('†')) {
          return '<sup><a href="#" class="text-xs text-gray-400 hover:text-gray-600">[citation]</a></sup>';
        }
        return match;
      })
      
      // Add proper paragraph breaks for newlines
      .replace(/\n{2,}/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      
      // Trim any excess whitespace
      .trim();
  };