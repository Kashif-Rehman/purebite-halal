import React from 'react';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle, Leaf } from 'lucide-react';
import { getStatusStyles } from '../utils/halalAnalysis';
import { useTranslation } from 'react-i18next';

const StatusIcon = ({ status }) => {
  const style = getStatusStyles(status);
  return (
    <div style={{
      backgroundColor: style.bg,
      color: style.color,
      padding: '12px',
      borderRadius: '16px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      {status === 'halal' && <CheckCircle size={32} />}
      {status === 'haram' && <XCircle size={32} />}
      {status === 'doubtful' && <AlertCircle size={32} />}
    </div>
  );
};

export default function ProductCard({ product, onClick, onFavorite, isFavorite }) {
  const { t } = useTranslation();
  const styles = getStatusStyles(product.status);
  const scoreText = product.health?.score?.key
    ? t(product.health.score.key)
    : product.health?.score?.text;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        border: '2px solid #f3f4f6',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        backgroundColor: 'white'
      }}
      onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
      onTouchEnd={(e) => e.currentTarget.style.backgroundColor = 'white'}
    >
      <div style={{
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Left Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '1 1 300px',
          minWidth: 0
        }}>
          <StatusIcon status={product.status} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
              flexWrap: 'wrap'
            }}>
              <h3 style={{
                fontSize: 'clamp(15px, 3vw, 18px)',
                fontWeight: 'bold',
                color: '#1f2937',
                wordBreak: 'break-word',
                margin: 0
              }}>
                {product.name}
              </h3>
              {product.source && (
                <span style={{
                  fontSize: '10px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  🌍
                </span>
              )}
              {product.health?.score && (
                <span style={{
                  fontSize: '10px',
                  background: product.health.score.color,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {(scoreText || '').split(' ')[0]}
                </span>
              )}
            </div>

            <p style={{
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              color: '#6b7280',
              marginBottom: '4px',
              margin: '4px 0'
            }}>
              {product.brand} • {product.category}
            </p>

            <p style={{
              fontSize: 'clamp(11px, 2vw, 12px)',
              color: '#9ca3af',
              margin: '4px 0'
            }}>
              📊 {product.barcode}
            </p>

            {/* Health badges */}
            {product.health && (product.health.issues?.length > 0 || product.health.benefits?.length > 0) && (
              <div style={{
                marginTop: '6px',
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                {product.health.issues?.length > 0 && (
                  <span style={{
                    fontSize: '10px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    padding: '3px 6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <AlertTriangle size={10} /> {product.health.issues?.length}
                  </span>
                )}
                {product.health.benefits?.length > 0 && (
                  <span style={{
                    fontSize: '10px',
                    background: '#d1fae5',
                    color: '#065f46',
                    padding: '3px 6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <Leaf size={10} /> {product.health.benefits?.length}
                  </span>
                )}
              </div>
            )}

            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: styles.bg,
              color: styles.color
            }}>
              {styles.text}
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '10px',
                border: '2px solid #f3f4f6'
              }}
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(product.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '4px',
              lineHeight: 1
            }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}