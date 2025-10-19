/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GIF Picker - Giphy Integration for Messages
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Allows users to search and select GIFs from Giphy to send in messages.
 */

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Giphy API - Get your free API key at https://developers.giphy.com/
// The old public beta key is deprecated
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; // This key may be expired/restricted
const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';
const GIPHY_TRENDING_URL = 'https://api.giphy.com/v1/gifs/trending';

// Alternative: Use Tenor (Google's GIF API) if Giphy doesn't work
const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'; // Demo key
const TENOR_SEARCH_URL = 'https://tenor.googleapis.com/v2/search';
const TENOR_TRENDING_URL = 'https://tenor.googleapis.com/v2/featured';

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
      console.log('[GifPicker] Loading trending GIFs from Tenor...');
      const url = `${TENOR_TRENDING_URL}?key=${TENOR_API_KEY}&limit=20&media_filter=gif&contentfilter=high`;
      console.log('[GifPicker] URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[GifPicker] Response data:', data);
      
      if (data.results && data.results.length > 0) {
        setGifs(data.results);
        console.log('[GifPicker] Loaded', data.results.length, 'trending GIFs');
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
      console.log('[GifPicker] Searching Tenor for:', term);
      const url = `${TENOR_SEARCH_URL}?key=${TENOR_API_KEY}&q=${encodeURIComponent(term)}&limit=20&media_filter=gif&contentfilter=high`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[GifPicker] Search results:', data);
      
      if (data.results && data.results.length > 0) {
        setGifs(data.results);
        console.log('[GifPicker] Found', data.results.length, 'GIFs');
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
    // Tenor API format (different from Giphy)
    const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
    const width = gif.media_formats?.gif?.dims?.[0] || 200;
    const height = gif.media_formats?.gif?.dims?.[1] || 200;
    
    onSelect({
      type: 'gif',
      url: gifUrl,
      width: width,
      height: height
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '20px',
        width: '500px',
        height: '500px',
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
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignContent: 'start'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: theme.text.secondary
          }}>
            Loading GIFs...
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: theme.text.secondary
          }}>
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
            textAlign: 'center',
            padding: '40px',
            color: theme.text.secondary
          }}>
            <div style={{ fontSize: '13px' }}>
              {searchTerm ? `No GIFs found for "${searchTerm}"` : 'No GIFs found'}
            </div>
          </div>
        ) : (
          gifs.map((gif) => {
            // Tenor API format - use preview GIF for better quality
            const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url;
            const width = gif.media_formats?.gif?.dims?.[0] || 300;
            const height = gif.media_formats?.gif?.dims?.[1] || 200;
            
            return (
              <div
                key={gif.id}
                onClick={() => handleGifClick(gif)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `1px solid ${theme.border.light}`,
                  transition: 'all 0.2s ease',
                  background: theme.background.elevated,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                  maxHeight: '300px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.button.primary;
                  e.currentTarget.style.boxShadow = theme.shadow.md;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border.light;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <img
                  src={gifUrl}
                  alt={gif.content_description || 'GIF'}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
            );
          })
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
        Powered by Tenor
      </div>
    </div>
  );
}

