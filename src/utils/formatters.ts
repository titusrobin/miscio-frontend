// src/utils/formatters.ts
export const formatOpenAIResponse = (content: string): string => {
  if (!content) return '';
  
  return content
    // NEW: Handle markdown headers (#### ## ###) - ADD THIS FIRST
    .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-gray-900 mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-4 mb-2">$1</h1>')
    
    // Handle bold formatting with double asterisks (keep your existing)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Handle bullet points with numbering (keep your existing)
    .replace(/^\d+\.\s/gm, '<br/>$&')
    
    // Handle citation references in square brackets (keep your existing)
    .replace(/\[(.*?)\]/g, (match, citation) => {
      // If it's a citation like [12:1†OneStop.txt], make it less intrusive
      if (citation.includes('†')) {
        return '<sup><a href="#" class="text-xs text-gray-400 hover:text-gray-600">[citation]</a></sup>';
      }
      return match;
    })
    
    // Add proper paragraph breaks for newlines (keep your existing)
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    
    // Clean up multiple spaces (keep your existing)
    .replace(/\s+/g, ' ')
    
    // Trim any excess whitespace (keep your existing)
    .trim();
};