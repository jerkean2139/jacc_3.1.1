import React from 'react';
<<<<<<< HEAD
import HtmlContentRenderer from './html-content-renderer';
=======
import { DocumentLink } from './document-link';
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className = '' }: MessageContentProps) {
<<<<<<< HEAD
  // Use the user-friendly HTML content renderer
  return <HtmlContentRenderer content={content} className={className} />;
=======
  // Check if content contains HTML tags
  const hasHtmlTags = /<[^>]*>/g.test(content);
  
  if (hasHtmlTags) {
    // Parse HTML content safely while preserving document links
    const parseHtmlContent = (htmlContent: string) => {
      // First, handle document links by converting markdown-style links to DocumentLink components
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let processedContent = htmlContent;
      const documentLinks: Array<{ id: string; name: string; placeholder: string }> = [];
      
      let match;
      while ((match = linkRegex.exec(htmlContent)) !== null) {
        const [fullMatch, linkText, linkUrl] = match;
        const isDocumentLink = linkUrl.includes('/documents/') || (linkUrl.includes('/api/documents/') && linkUrl.includes('/view'));
        
        if (isDocumentLink) {
          let documentIdMatch = linkUrl.match(/\/documents\/([^/]+)/);
          if (!documentIdMatch) {
            documentIdMatch = linkUrl.match(/\/api\/documents\/([^/]+)\/view/);
          }
          const documentId = documentIdMatch ? documentIdMatch[1] : '';
          
          if (documentId) {
            const placeholder = `__DOCUMENT_LINK_${documentLinks.length}__`;
            documentLinks.push({ id: documentId, name: linkText, placeholder });
            processedContent = processedContent.replace(fullMatch, placeholder);
          }
        }
      }
      
      // Create HTML with placeholders replaced by DocumentLink components
      const htmlParts = processedContent.split(/(__DOCUMENT_LINK_\d+__)/);
      
      return htmlParts.map((part, index) => {
        const linkMatch = part.match(/__DOCUMENT_LINK_(\d+)__/);
        if (linkMatch) {
          const linkIndex = parseInt(linkMatch[1]);
          const docLink = documentLinks[linkIndex];
          return (
            <DocumentLink
              key={`doc-${index}`}
              documentId={docLink.id}
              documentName={docLink.name}
              className="mx-1"
            />
          );
        }
        
        // Render HTML content safely
        return (
          <div 
            key={index}
            dangerouslySetInnerHTML={{ __html: part }}
            className="prose prose-slate dark:prose-invert max-w-none leading-relaxed [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-4 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-4 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul]:mt-3 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol]:mt-3 [&>li]:mb-3 [&>li]:leading-relaxed [&>p]:mb-6 [&>p]:leading-relaxed [&>p]:text-base [&>strong]:font-semibold [&>em]:italic [&>br]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-6"
          />
        );
      });
    };
    
    return (
      <div className={className}>
        {parseHtmlContent(content)}
      </div>
    );
  }
  
  // Fallback to original markdown parsing for non-HTML content
  const parseContent = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    
    // Regex to match markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      const [fullMatch, linkText, linkUrl] = match;
      const startIndex = match.index;
      
      // Add text before the link
      if (startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, startIndex)}
          </span>
        );
      }
      
      // Check if this is a document link (handles both /documents/{id} and /api/documents/{id}/view formats)
      const isDocumentLink = linkUrl.includes('/documents/') || (linkUrl.includes('/api/documents/') && linkUrl.includes('/view'));
      
      if (isDocumentLink) {
        // Extract document ID from URL - handle both formats
        let documentIdMatch = linkUrl.match(/\/documents\/([^/]+)/);
        if (!documentIdMatch) {
          documentIdMatch = linkUrl.match(/\/api\/documents\/([^/]+)\/view/);
        }
        const documentId = documentIdMatch ? documentIdMatch[1] : '';
        
        if (documentId) {
          parts.push(
            <DocumentLink
              key={`doc-${startIndex}`}
              documentId={documentId}
              documentName={linkText}
              className="mx-1"
            />
          );
        } else {
          // Fallback to regular link
          parts.push(
            <a
              key={`link-${startIndex}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              {linkText}
            </a>
          );
        }
      } else {
        // Regular external link
        parts.push(
          <a
            key={`link-${startIndex}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            {linkText}
          </a>
        );
      }
      
      lastIndex = startIndex + fullMatch.length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Split content by newlines and process each line
  const lines = (content || '').split('\n');
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
          {parseContent(line)}
        </div>
      ))}
    </div>
  );
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
}