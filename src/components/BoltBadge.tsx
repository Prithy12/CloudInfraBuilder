import React from 'react';

const BoltBadge: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-transform hover:scale-105"
        title="Built with Bolt.new"
      >
        <img
          src="/white_circle_360x360.svg"
          alt="Bolt.new Hackathon Badge"
          className="w-12 h-12 md:w-16 md:h-16"
          style={{ display: 'block' }}
        />
      </a>
    </div>
  );
};

export default BoltBadge; 