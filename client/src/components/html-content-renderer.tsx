import React from 'react';
import { DocumentLink } from './document-link';

interface HtmlContentRendererProps {
  content: string;
  className?: string;
}

function HtmlContentRenderer({ content, className = '' }: HtmlContentRendererProps) {
  // Clean up and normalize content first
  const cleanContent = content.replace(/\s+/g, ' ').trim();
  
  // Check if content contains HTML tags
  const hasHtmlTags = /<[^>]*>/g.test(cleanContent);
  
  if (!hasHtmlTags) {
    // Plain text content - format nicely with line breaks
    const formattedContent = cleanContent
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    return (
      <div className={className}>
        <div 
          dangerouslySetInnerHTML={{ __html: `<p>${formattedContent}</p>` }}
          className="text-gray-900 dark:text-white leading-relaxed space-y-3 
            [&>p]:mb-3 [&>p]:leading-relaxed [&>p]:text-gray-900 [&>p]:dark:text-white [&>br]:mb-2"
        />
      </div>
    );
  }

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
      
      // Render HTML content with enhanced beautiful, user-friendly styling
      return (
        <div 
          key={index}
          dangerouslySetInnerHTML={{ __html: part }}
          className="prose prose-slate dark:prose-invert max-w-none leading-relaxed
            [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-4 [&>h1]:text-gray-900 [&>h1]:dark:text-white [&>h1]:border-b [&>h1]:border-gray-200 [&>h1]:pb-2
            [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-3 [&>h2]:text-blue-700 [&>h2]:dark:text-blue-300  
            [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-blue-600 [&>h3]:dark:text-blue-400
            [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ul]:mt-3 [&>ul]:space-y-2
            [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>ol]:mt-3 [&>ol]:space-y-2
            [&>li]:mb-2 [&>li]:leading-relaxed [&>li]:text-gray-700 [&>li]:dark:text-gray-300 [&>li]:pl-1
            [&>p]:mb-4 [&>p]:leading-relaxed [&>p]:text-base [&>p]:text-gray-700 [&>p]:dark:text-gray-300
            [&>strong]:font-semibold [&>strong]:text-blue-700 [&>strong]:dark:text-blue-300
            [&>em]:italic [&>em]:text-gray-600 [&>em]:dark:text-gray-400
            [&>br]:mb-2 
            [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4 [&>blockquote]:bg-blue-50 [&>blockquote]:dark:bg-blue-900/20 [&>blockquote]:py-2
            [&>code]:bg-blue-100 [&>code]:dark:bg-blue-900/30 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-sm [&>code]:text-blue-800 [&>code]:dark:text-blue-200
            [&>pre]:bg-gray-100 [&>pre]:dark:bg-gray-800 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-4 [&>pre]:border [&>pre]:border-gray-200 [&>pre]:dark:border-gray-700"
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

export default HtmlContentRenderer;