import './Loading.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullPage?: boolean;
}

export function Loading({ size = 'medium', text, fullPage = false }: LoadingProps) {
  const content = (
    <div className={`loading-container ${size}`}>
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="loading-fullpage">{content}</div>;
  }

  return content;
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="loading-overlay">
      <Loading size="large" text={text} />
    </div>
  );
}

export function LoadingSkeleton({ width, height, rounded = false }: { width?: string | number; height?: string | number; rounded?: boolean }) {
  return (
    <div
      className={`loading-skeleton ${rounded ? 'rounded' : ''}`}
      style={{ width, height }}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-skeleton">
      <div className="table-skeleton-header">
        {Array.from({ length: columns }).map((_, i) => (
          <LoadingSkeleton key={i} height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="table-skeleton-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton key={colIndex} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}
