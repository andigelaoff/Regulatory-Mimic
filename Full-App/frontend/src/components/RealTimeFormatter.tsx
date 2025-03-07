import React from 'react';
 
interface RealTimeFormatterProps {
  content: string;
}
 
const RealTimeFormatter: React.FC<RealTimeFormatterProps> = ({ content }) => {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, lineIndex) => {
      line = line.trim();
      const headingMatch = line.match(/^(#{1,6})\s*(.*)/);
      if (headingMatch) {
        return (
<div key={`line-${lineIndex}`} style={{
            fontWeight: 'bold',
            fontSize: '1.2em',
            marginTop: '12px',
            marginBottom: '8px',
            color: '#2c5282'
          }}>
            {headingMatch[2]} 
</div>
        );
      }
 
      if (line.startsWith('- ')) {
        const withoutDash = line.substring(2).trim();
        return (
<div key={`line-${lineIndex}`} className="bullet-item" style={{
            marginLeft: '20px',
            marginTop: '8px',
          }}>
<span style={{ fontWeight: 'bold', marginRight: '5px' }}>•</span>
<span dangerouslySetInnerHTML={{ __html: processBoldText(withoutDash) }} />
</div>
        );
      }
      return (
<div key={`line-${lineIndex}`} style={{ marginTop: '8px' }}>
<span dangerouslySetInnerHTML={{ __html: processBoldText(line) }} />
</div>
      );
    });
  };
 
  const processBoldText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); 
  };
 
  return (
<div style={{ 
      lineHeight: '1.5',
      color: '#2d3748',
      fontSize: '14px'
    }}>
      {formatContent(content)}
</div>
  );
};
 
export default RealTimeFormatter;