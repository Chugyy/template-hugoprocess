import React, { useState } from 'react';
import Input from '../../atoms/Input';
import Button from '../../atoms/Button';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  expandable?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  expandable = false,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(!expandable);

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  };

  if (expandable && !isExpanded) {
    return (
      <Button
        icon="search"
        variant="tertiary"
        onClick={() => setIsExpanded(true)}
        className={className}
      />
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        startIcon="search"
        fullWidth={!expandable}
      />
      <Button
        icon="search"
        variant="primary"
        onClick={handleSearch}
        disabled={!query.trim()}
      />
      {expandable && (
        <Button
          icon="close"
          variant="tertiary"
          onClick={() => {
            setIsExpanded(false);
            setQuery('');
          }}
        />
      )}
    </div>
  );
};

export default SearchBar;