import React from 'react';
import { Share2, Activity, Leaf, AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getStatusStyles } from '../utils/halalAnalysis';
import { eCodeDatabase } from '../utils/database';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

const StatusIcon = ({ status }) => {
  const style = getStatusStyles(status);
  return (
    <div style={{ 
      backgroundColor: style.bg, 
      color: style.color, 
      padding: '16px', 
      borderRadius: '20px', 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginBottom: '16px'
    }}>
      {status === 'halal' && <CheckCircle size={48} />}
      {status === 'haram' && <XCircle size={48} />}
      {status === 'doubtful' && <AlertCircle size={48} />}
    </div>
  );
};

export default function ProductDetails({ product }) {
  const { t } = useTranslation();
  const styles = getStatusStyles(product.status);
  const statusText = t(`status.${product.status}`, { defaultValue: product.status });
  const reasonText = product.reasonKey
    ? t(product.reasonKey, product.reasonParams)
    : product.reason;
  const getHealthText = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (item.key) return t(item.key, item.value !== undefined ? { value: item.value } : undefined);
    return '';
  };
  const ingredientKeyMap = {
    'chicken': 'ingredients.chicken',
    'beef': 'ingredients.beef',
    'pork': 'ingredients.pork',
    'spices': 'ingredients.spices',
    'milk': 'ingredients.milk',
    'salt': 'ingredients.salt',
    'rennet': 'ingredients.rennet',
    'potatoes': 'ingredients.potatoes',
    'oil': 'ingredients.oil',
    'sugar': 'ingredients.sugar',
    'gelatin': 'ingredients.gelatin',
    'water': 'ingredients.water',
    'not available': 'ingredients.not_available'
  };
  const translateIngredient = (ingredient) => {
    const normalized = String(ingredient || '').trim().toLowerCase();
    const key = ingredientKeyMap[normalized];
    return key ? t(key) : ingredient;
  };
  const scoreText = product.health?.score?.key
    ? t(product.health.score.key)
    : product.health?.score?.text;

  const handleShare = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: t('general.appName'),
          text: `${product.name} - ${statusText}\n${product.reason}`,
          url: 'https://halalfoodchecker.app',
          dialogTitle: t('product.shareDialogTitle'),
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Web fallback
      if (navigator.share) {
        try {
          await navigator.share({
            title: product.name,
            text: `${product.name} - ${statusText}`,
            url: window.location.href
          });
        } catch (error) {
          console.error('Share error:', error);
        }
      }
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        {product.image && (
          <img 
            src={product.image} 
            alt={product.name} 
            style={{ 
              width: '150px', 
              height: '150px', 
              objectFit: 'cover', 
              borderRadius: '16px', 
              margin: '0 auto 16px', 
              border: '3px solid #f3f4f6',
              display: 'block'
            }} 
          />
        )}
        <StatusIcon status={product.status} />
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          margin: '16px 0 8px' 
        }}>
          {product.name}
        </h2>
        <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>
          {product.brand}
          {product.source && (
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '13px', 
              background: '#dbeafe', 
              color: '#1e40af', 
              padding: '4px 12px', 
              borderRadius: '8px', 
              fontWeight: '600' 
            }}>
              🌍 {product.source}
            </span>
          )}
        </p>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>
          📊 {t('product.barcodeLabel')}: {product.barcode}
        </p>
        <span style={{ 
          display: 'inline-block', 
          padding: '12px 28px', 
          borderRadius: '16px', 
          fontSize: '20px', 
          fontWeight: 'bold', 
          backgroundColor: styles.bg, 
          color: styles.color 
        }}>
          {styles.text}
        </span>
      </div>

      {/* Health Analysis */}
      {product.health && (product.health.issues.length > 0 || product.health.benefits.length > 0 || product.health.score) && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
          borderRadius: '16px', 
          border: '2px solid #bae6fd' 
        }}>
          <h3 style={{ 
            fontWeight: 'bold', 
            color: '#0c4a6e', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '20px',
            margin: '0 0 16px 0'
          }}>
            <Activity size={24} /> {t('product.healthAnalysis')}
          </h3>
          
          {product.health.score && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: 'white', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: product.health.score.color, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '24px' 
              }}>
                {(scoreText || '').charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px', margin: 0 }}>
                  {t('product.nutriScore')}
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  {scoreText}
                </p>
              </div>
            </div>
          )}

          {product.health.calories && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '12px' }}>
              <h4 style={{ 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '12px', 
                fontSize: 'clamp(14px, 3vw, 16px)',
                margin: '0 0 12px 0'
              }}>
                {t('product.nutritionPer100g')}
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '8px' 
              }}>
                {product.health.calories && (
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t('product.calories')}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {product.health.calories} kcal
                    </p>
                  </div>
                )}
                {product.health.fat && (
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t('product.fat')}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {product.health.fat}g
                    </p>
                  </div>
                )}
                {product.health.carbs && (
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t('product.carbs')}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {product.health.carbs}g
                    </p>
                  </div>
                )}
                {product.health.protein && (
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t('product.protein')}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {product.health.protein}g
                    </p>
                  </div>
                )}
                {product.health.sugar && (
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t('product.sugar')}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {product.health.sugar}g
                    </p>
                  </div>
                )}
                {product.health.salt && (
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t('product.salt')}</p>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {product.health.salt}g
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {product.health.benefits.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ 
                fontWeight: '600', 
                color: '#065f46', 
                marginBottom: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '16px',
                margin: '0 0 8px 0'
              }}>
                <Leaf size={18} /> {t('product.healthBenefits')}
              </h4>
              {product.health.benefits.map((benefit, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '10px', 
                    background: '#d1fae5', 
                    borderRadius: '8px', 
                    marginBottom: '6px', 
                    color: '#065f46', 
                    fontSize: '14px' 
                  }}
                >
                  ✓ {getHealthText(benefit)}
                </div>
              ))}
            </div>
          )}

          {product.health.issues.length > 0 && (
            <div>
              <h4 style={{ 
                fontWeight: '600', 
                color: '#991b1b', 
                marginBottom: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '16px',
                margin: '0 0 8px 0'
              }}>
                <AlertTriangle size={18} /> {t('product.healthConcerns')}
              </h4>
              {product.health.issues.map((issue, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '10px', 
                    background: '#fee2e2', 
                    borderRadius: '8px', 
                    marginBottom: '6px', 
                    color: '#991b1b', 
                    fontSize: '14px' 
                  }}
                >
                  ⚠️ {getHealthText(issue)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Halal Analysis */}
      <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
          {t('product.halalAnalysis')}
        </h3>
        <p style={{ color: '#374151', margin: 0 }}>{reasonText}</p>
      </div>

      {/* Ingredients */}
      <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', margin: '0 0 12px 0' }}>
          {t('product.ingredients')}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {product.ingredients.map((ing, idx) => (
            <span 
              key={idx} 
              style={{ 
                padding: '8px 16px', 
                background: 'white', 
                borderRadius: '20px', 
                fontSize: '14px', 
                color: '#374151', 
                border: '1px solid #e5e7eb' 
              }}
            >
              {translateIngredient(ing)}
            </span>
          ))}
        </div>
      </div>

      {/* E-Codes */}
      {product.eCodes && product.eCodes.length > 0 && (
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', margin: '0 0 12px 0' }}>
            {t('product.eCodesFound')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {product.eCodes.map((code, idx) => {
              const eInfo = eCodeDatabase[code];
              if (!eInfo) {
                return (
                  <div key={idx} style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                    <p style={{ fontWeight: '600', margin: 0 }}>
                      {code} - {t('product.verifyManufacturer')}
                    </p>
                  </div>
                );
              }
              const eStyles = getStatusStyles(eInfo.status);
              return (
                <div key={idx} style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start',
                    gap: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>
                        {code} - {eInfo.nameKey ? t(eInfo.nameKey) : eInfo.name}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        {eInfo.concernKey ? t(eInfo.concernKey) : eInfo.concern}
                      </p>
                    </div>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '8px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      backgroundColor: eStyles.bg, 
                      color: eStyles.color,
                      whiteSpace: 'nowrap'
                    }}>
                      {t(`status.${eInfo.status}`, { defaultValue: eInfo.status })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Button */}
      <button 
        onClick={handleShare}
        style={{ 
          width: '100%', 
          background: '#059669', 
          color: 'white', 
          padding: '16px', 
          borderRadius: '12px', 
          border: 'none', 
          fontWeight: '600', 
          fontSize: '16px', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px' 
        }}
      >
        <Share2 size={20} />
        {t('product.shareResult')}
      </button>
    </div>
  );
}