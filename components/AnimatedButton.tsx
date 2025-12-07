import React from 'react';

interface AnimatedButtonProps {
  text: string;
  onClick: () => void;
  className?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ text, onClick, className = '' }) => {
  return (
    <>
      <button 
        className={`simple-button ${className}`}
        onClick={onClick}
      >
        {text}
      </button>
      
      <style jsx>{`
        .simple-button {
          background: #000000;
          color: #fff;
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 24px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .simple-button:hover {
          border-color: rgba(34, 197, 94, 0.6);
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
        }
      `}</style>
    </>
  );
};

export default AnimatedButton;
