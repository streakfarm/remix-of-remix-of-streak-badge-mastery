import { useEffect, useRef } from 'react';

interface AdUnitRendererProps {
  adCode: string;
  className?: string;
}

/**
 * Safely renders ad network HTML/script code inside an iframe sandbox
 */
export function AdUnitRenderer({ adCode, className }: AdUnitRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !adCode) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100%; 
              overflow: hidden;
              background: transparent;
            }
          </style>
        </head>
        <body>${adCode}</body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  }, [adCode]);

  if (!adCode) return null;

  return (
    <iframe
      ref={iframeRef}
      className={className}
      style={{ border: 'none', width: '100%', minHeight: '100px' }}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      title="Ad"
    />
  );
}
