import React from 'react';
import { Info, Globe, Shield, Mail, ExternalLink, Heart, Users, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function About({ onClose }) {
  const { t } = useTranslation();
  const appVersion = '1.0.0';
  
  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <img 
            src="/assets/icon.png" 
            alt="PureBite Halal" 
            className="about-logo"
          />
          <h2>PureBite Halal</h2>
          <p className="about-version">Version {appVersion}</p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <div className="about-section-header">
              <Info size={20} />
              <h3>{t('about.aboutTitle')}</h3>
            </div>
            <p>{t('about.aboutText')}</p>
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <BookOpen size={20} />
              <h3>{t('about.dataSourcesTitle')}</h3>
            </div>
            <ul className="about-list">
              <li>
                <strong>Open Food Facts</strong>
                <a 
                  href="https://world.openfoodfacts.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="about-link"
                >
                  openfoodfacts.org <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <strong>Spoonacular API</strong>
                <a 
                  href="https://spoonacular.com/food-api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="about-link"
                >
                  spoonacular.com <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <Shield size={20} />
              <h3>{t('about.privacyTitle')}</h3>
            </div>
            <p>{t('about.privacyText')}</p>
            <a 
              href="/privacy-policy.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="about-action-button"
            >
              {t('about.readPrivacyPolicy')} <ExternalLink size={16} />
            </a>
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <Heart size={20} />
              <h3>{t('about.acknowledgmentsTitle')}</h3>
            </div>
            <p>{t('about.acknowledgmentsText')}</p>
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <Users size={20} />
              <h3>{t('about.communityTitle')}</h3>
            </div>
            <p>{t('about.communityText')}</p>
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <Mail size={20} />
              <h3>{t('about.contactTitle')}</h3>
            </div>
            <p>{t('about.contactText')}</p>
            <a 
              href="mailto:support@purebitehalal.com"
              className="about-action-button"
            >
              {t('about.contactEmail')}
            </a>
          </section>

          <section className="about-section disclaimer">
            <div className="about-section-header">
              <Globe size={20} />
              <h3>{t('about.disclaimerTitle')}</h3>
            </div>
            <p className="disclaimer-text">{t('about.disclaimerText')}</p>
          </section>
        </div>

        <button className="about-close-btn" onClick={onClose}>
          {t('about.close')}
        </button>
      </div>
    </div>
  );
}
