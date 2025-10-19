/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GIF Picker - Giphy Integration for Messages
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Allows users to search and select GIFs from Giphy to send in messages.
 */

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Using Giphy public beta key - limited to 42 requests/hour
// For production, get your own key at: https://developers.giphy.com/
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; 
const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';
const GIPHY_TRENDING_URL = 'https://api.giphy.com/v1/gifs/trending';

export default function GifPicker({ onSelect, onClose }) {
  const { theme } = useTheme();
  const [gifs, setGifs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  // Load trending GIFs on mount
  useEffect(() => {
    loadTrending();
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const loadTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[GifPicker] Loading trending GIFs...');
      const url = `${GIPHY_TRENDING_URL}?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
      console.log('[GifPicker] URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[GifPicker] Response data:', data);
      
      if (data.data && data.data.length > 0) {
        setGifs(data.data);
        console.log('[GifPicker] Loaded', data.data.length, 'trending GIFs');
      } else {
        console.warn('[GifPicker] No GIFs in response');
        setGifs([]);
      }
    } catch (error) {
      console.error('[GifPicker] Failed to load trending:', error);
      setError(error.message);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (term) => {
    if (!term.trim()) {
      loadTrending();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[GifPicker] Searching for:', term);
      const url = `${GIPHY_SEARCH_URL}?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(term)}&limit=20&rating=g`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[GifPicker] Search results:', data);
      
      if (data.data && data.data.length > 0) {
        setGifs(data.data);
        console.log('[GifPicker] Found', data.data.length, 'GIFs');
      } else {
        setGifs([]);
        console.log('[GifPicker] No GIFs found for search:', term);
      }
    } catch (error) {
      console.error('[GifPicker] Search failed:', error);
      setError(error.message);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchGifs(searchTerm);
  };

  const handleGifClick = (gif) => {
    onSelect({
      type: 'gif',
      url: gif.images.fixed_height.url,
      width: parseInt(gif.images.fixed_height.width),
      height: parseInt(gif.images.fixed_height.height)
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '20px',
        width: '400px',
        height: '400px',
        background: theme.background.card,
        border: `1px solid ${theme.border.normal}`,
        borderRadius: '12px',
        boxShadow: theme.shadow.xl,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.border.normal}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: theme.text.primary
        }}>
          {searchTerm ? 'Search Results' : 'Trending GIFs'}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            color: theme.text.tertiary,
            cursor: 'pointer',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = theme.background.elevated;
            e.target.style.color = theme.text.primary;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = theme.text.tertiary;
          }}
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border.light}` }}>
        <form onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Auto-search as user types (debounced)
              clearTimeout(window.gifSearchTimeout);
              window.gifSearchTimeout = setTimeout(() => {
                searchGifs(e.target.value);
              }, 500);
            }}
            placeholder="Search GIFs..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${theme.border.medium}`,
              borderRadius: '8px',
              fontSize: '13px',
              background: theme.background.card,
              color: theme.text.primary,
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = theme.button.primary}
            onBlur={(e) => e.target.style.borderColor = theme.border.medium}
          />
        </form>
      </div>

      {/* GIF Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        alignContent: 'start'
      }}>
        {loading ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: theme.text.secondary
          }}>
            Loading GIFs...
          </div>
        ) : error ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: theme.text.secondary
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontSize: '13px', color: theme.text.primary, fontWeight: '500', marginBottom: '8px' }}>
              Failed to load GIFs
            </div>
            <div style={{ fontSize: '12px', marginBottom: '12px' }}>
              {error}
            </div>
            <button
              onClick={loadTrending}
              style={{
                padding: '8px 16px',
                background: theme.button.primary,
                color: theme.text.inverse,
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : gifs.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: theme.text.secondary
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '13px' }}>
              {searchTerm ? `No GIFs found for "${searchTerm}"` : 'No GIFs found'}
            </div>
          </div>
        ) : (
          gifs.map((gif) => (
            <div
              key={gif.id}
              onClick={() => handleGifClick(gif)}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                border: `1px solid ${theme.border.light}`,
                transition: 'all 0.2s ease',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.background.elevated
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = theme.button.primary;
                e.currentTarget.style.boxShadow = theme.shadow.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = theme.border.light;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={gif.images.fixed_height_small.url}
                alt={gif.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px',
        borderTop: `1px solid ${theme.border.light}`,
        textAlign: 'center',
        fontSize: '10px',
        color: theme.text.tertiary
      }}>
        Powered by GIPHY
      </div>
    </div>
  );
}

