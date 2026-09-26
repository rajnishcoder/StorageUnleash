import React, { useState } from 'react';
import { Heart, Coffee, Sparkles, Rocket, X, ExternalLink } from 'lucide-react';
import { formatBytes } from '@shared/utils/formatters';
import './SupportModal.css';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reclaimedBytes?: number;
}

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/rajnishcoder';
const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/rajnishcoder';

const SUPPORT_TIERS = [
  {
    amount: 5,
    label: '$5',
    tagline: 'Thanks! ☕',
    description: 'Buy a coffee for the developer',
    icon: Coffee,
    url: 'https://buymeacoffee.com/rajnishcoder'
  },
  {
    amount: 10,
    label: '$10',
    tagline: 'You Rock! ❤️',
    description: 'Really appreciate the support',
    icon: Heart,
    highlight: true,
    url: 'https://buymeacoffee.com/rajnishcoder'
  },
  {
    amount: 20,
    label: '$20',
    tagline: 'Fund Future Dev 🚀',
    description: 'Support ongoing updates & tools',
    icon: Rocket,
    url: 'https://buymeacoffee.com/rajnishcoder'
  }
];

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  reclaimedBytes
}) => {
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const handleOpenUrl = (url: string) => {
    if (window.storageAPI?.openExternalUrl) {
      window.storageAPI.openExternalUrl(url).catch(() => {
        window.open(url, '_blank');
      });
    } else {
      window.open(url, '_blank');
    }
    // Record support interaction
    localStorage.setItem('su_support_supported', 'true');
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleOpenUrl(GITHUB_SPONSORS_URL);
  };

  const handleDismiss = () => {
    // Cooldown: 7 days before auto-prompting again after cleanup
    localStorage.setItem('su_support_last_dismissed', Date.now().toString());
    onClose();
  };

  return (
    <div className="support-modal-overlay" onClick={handleDismiss}>
      <div className="support-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="support-modal-close-btn"
          onClick={handleDismiss}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="support-modal-header">
          <div className="support-heart-badge">
            <Heart size={28} className="support-heart-icon" />
          </div>
          <h2 className="support-modal-title">Enjoying Storage Unleashed?</h2>
          
          {reclaimedBytes !== undefined && reclaimedBytes > 0 && (
            <div className="support-reclaimed-banner">
              <Sparkles size={15} color="#38bdf8" />
              <span>
                You just reclaimed <strong>{formatBytes(reclaimedBytes)}</strong> of storage! 🎉
              </span>
            </div>
          )}

          <p className="support-modal-desc">
            Storage Unleashed is <strong>100% free, private, and local</strong> — no accounts, no subscriptions, and zero tracking. If it helped you free up disk space, consider supporting ongoing development!
          </p>
        </div>

        <div className="support-tiers-grid">
          {SUPPORT_TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <button
                key={tier.amount}
                type="button"
                className={`support-tier-card ${tier.highlight ? 'highlight' : ''}`}
                onClick={() => handleOpenUrl(tier.url)}
              >
                {tier.highlight && <span className="tier-popular-pill">Most Popular</span>}
                <div className="tier-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="tier-amount">{tier.label}</div>
                <div className="tier-tagline">{tier.tagline}</div>
                <div className="tier-desc">{tier.description}</div>
              </button>
            );
          })}
        </div>

        {showCustomInput ? (
          <form className="support-custom-form" onSubmit={handleCustomSubmit}>
            <div className="custom-input-wrap">
              <span className="custom-currency">$</span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="Custom amount"
                className="custom-amount-input"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="custom-submit-btn">
              <span>Support</span>
              <ExternalLink size={14} />
            </button>
            <button
              type="button"
              className="custom-cancel-btn"
              onClick={() => setShowCustomInput(false)}
            >
              Back
            </button>
          </form>
        ) : (
          <div className="support-footer-actions">
            <button
              type="button"
              className="btn-custom-amount"
              onClick={() => handleOpenUrl(BUY_ME_A_COFFEE_URL)}
            >
              ☕ Buy Me a Coffee
            </button>
            <span className="footer-action-divider">•</span>
            <button
              type="button"
              className="btn-custom-amount"
              onClick={() => handleOpenUrl(GITHUB_SPONSORS_URL)}
            >
              ❤️ GitHub Sponsors
            </button>
            <span className="footer-action-divider">•</span>
            <button
              type="button"
              className="btn-maybe-later"
              onClick={handleDismiss}
            >
              Maybe Later
            </button>
          </div>
        )}

        <div className="support-feedback-hint">
          Found a bug or have an idea?{' '}
          <button
            type="button"
            className="btn-link-inline"
            onClick={() => handleOpenUrl('https://github.com/rajnishcoder/StorageUnleash/issues')}
          >
            Report on GitHub <ExternalLink size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
