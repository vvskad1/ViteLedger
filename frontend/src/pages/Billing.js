import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, ExternalLink, Sparkles, Shield, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { getMySubscription, createSubscription, openPortal, cancelSubscription, mockActivate } from '../utils/subs';
import { getPlanColor, formatPeriod } from '../utils/planGate';
import './Billing.css';

const PLANS = {
  basic: {
    name: 'Basic',
    features: [
      'Health tracking',
      'Basic meal logging',
      'Sleep tracking',
      'Appointment reminders'
    ]
  },
  plus: {
    name: 'Plus',
    features: [
      'Everything in Basic',
      'AI meal plan generator',
      'Mindfulness features',
      'Advanced analytics',
      'Lab report analysis'
    ]
  },
  pro: {
    name: 'Pro',
    features: [
      'Everything in Plus',
      'Priority AI support',
      'Custom fitness plans',
      'Unlimited AI queries',
      'Advanced caretaker AI'
    ]
  }
};

const PRICES = {
  basic: { weekly: 2.99, monthly: 9.99, yearly: 99.99 },
  plus: { weekly: 4.99, monthly: 16.99, yearly: 169.99 },
  pro: { weekly: 7.99, monthly: 24.99, yearly: 249.99 }
};

const Billing = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('plus');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [processing, setProcessing] = useState(false);
  const [isDev] = useState(process.env.REACT_APP_SUBS_MODE === 'MOCK');
  const [isSandbox] = useState(process.env.REACT_APP_SUBS_MODE === 'LAVA_SANDBOX');

  useEffect(() => {
    loadSubscription();
    
    // Show sandbox notification
    if (isSandbox) {
      console.log('🧪 Lava Sandbox Mode — Use test card: 4242 4242 4242 4242, Exp: 12/34, CVC: 123');
    }
  }, [isSandbox]);

  const loadSubscription = async () => {
    try {
      const data = await getMySubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const result = await createSubscription(selectedPlan, selectedPeriod);
      window.open(result.checkout_url, '_blank');
    } catch (error) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePortal = async () => {
    try {
      const result = await openPortal();
      window.open(result.url, '_blank');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? Access will continue until the end of the current billing period.')) {
      return;
    }
    
    setProcessing(true);
    try {
      await cancelSubscription();
      await loadSubscription();
      alert('Subscription canceled successfully');
    } catch (error) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMockActivate = async () => {
    setProcessing(true);
    try {
      await mockActivate(selectedPlan, selectedPeriod);
      await loadSubscription();
    } catch (error) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';
  const currentPlan = subscription?.plan;
  const isTrial = subscription?.is_trial && subscription?.status === 'trial';

  return (
    <Layout>
      <div className="billing-container">
        <div className="billing-header">
          <h1>
            <CreditCard size={32} />
            Billing & Subscription
          </h1>
          <p>Manage your VitaLedger subscription</p>
        </div>

        {/* Sandbox Mode Banner */}
        {isSandbox && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sandbox-banner"
          >
            <div className="sandbox-content">
              <span className="sandbox-icon">🧪</span>
              <div>
                <strong>Sandbox Mode – Test Environment</strong>
                <p>For demo/testing only. Use test card: <code>4242 4242 4242 4242</code>, Exp: <code>12/34</code>, CVC: <code>123</code></p>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <Card className="loading-card">
            <p>Loading subscription...</p>
          </Card>
        ) : (
          <>
            {/* Current Subscription Status */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="current-subscription"
              >
                <Card>
                  <div className="sub-status-header">
                    <div>
                      <h3>Current Subscription</h3>
                      {isTrial ? (
                        <div className="sub-badge" style={{ backgroundColor: '#10b981' }}>
                          <Sparkles size={16} />
                          Free Trial - {PLANS[currentPlan]?.name}
                        </div>
                      ) : (
                        <div className="sub-badge" style={{ backgroundColor: getPlanColor(currentPlan) }}>
                          <Shield size={16} />
                          {PLANS[currentPlan]?.name} - {formatPeriod(subscription.period)}
                        </div>
                      )}
                    </div>
                    <div className="sub-status">
                      <span className={`status-indicator ${subscription.status}`}>
                        {subscription.status === 'active' && <Check size={16} />}
                        {subscription.status === 'trial' && <Sparkles size={16} />}
                        {isTrial ? 'FREE TRIAL' : subscription.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {isTrial && subscription.trial_ends_at && (
                    <div className="trial-notice">
                      <p className="trial-text">
                        🎉 You're enjoying a <strong>3-day free trial</strong> with full {PLANS[currentPlan]?.name} features!
                      </p>
                      <p className="renewal-date">
                        Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()} at {new Date(subscription.trial_ends_at).toLocaleTimeString()}
                      </p>
                      <p className="trial-upgrade-note">
                        Upgrade anytime to continue using premium features after your trial.
                      </p>
                    </div>
                  )}
                  
                  {!isTrial && subscription.ends_at && (
                    <p className="renewal-date">
                      {subscription.status === 'canceled' ? 'Access until:' : 'Renews on:'}{' '}
                      {new Date(subscription.ends_at).toLocaleDateString()}
                    </p>
                  )}

                  <div className="sub-actions">
                    {!isTrial && (
                      <Button onClick={handlePortal} variant="secondary">
                        <ExternalLink size={16} />
                        Manage Subscription
                      </Button>
                    )}
                    {subscription.status === 'active' && !isTrial && (
                      <Button onClick={handleCancel} variant="secondary">
                        Cancel Renewal
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Period Selector */}
            <div className="period-selector">
              <button
                className={selectedPeriod === 'weekly' ? 'active' : ''}
                onClick={() => setSelectedPeriod('weekly')}
              >
                Weekly
              </button>
              <button
                className={selectedPeriod === 'monthly' ? 'active' : ''}
                onClick={() => setSelectedPeriod('monthly')}
              >
                Monthly
                <span className="badge">Popular</span>
              </button>
              <button
                className={selectedPeriod === 'yearly' ? 'active' : ''}
                onClick={() => setSelectedPeriod('yearly')}
              >
                Yearly
                <span className="badge">Save 20%</span>
              </button>
            </div>

            {/* Plan Cards */}
            <div className="plans-grid">
              {Object.entries(PLANS).map(([planKey, planData]) => {
                const price = PRICES[planKey][selectedPeriod];
                const isCurrent = isActive && currentPlan === planKey;
                const isUpgrade = isActive && PLANS[currentPlan] && 
                  ['basic', 'plus', 'pro'].indexOf(planKey) > ['basic', 'plus', 'pro'].indexOf(currentPlan);
                
                return (
                  <motion.div
                    key={planKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ['basic', 'plus', 'pro'].indexOf(planKey) * 0.1 }}
                  >
                    <Card className={`plan-card ${selectedPlan === planKey ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}>
                      {planKey === 'plus' && (
                        <div className="popular-badge">
                          <Sparkles size={14} />
                          Most Popular
                        </div>
                      )}
                      
                      <div className="plan-header">
                        <h3>{planData.name}</h3>
                        <div className="plan-price">
                          <span className="currency">$</span>
                          <span className="amount">{price.toFixed(2)}</span>
                          <span className="period">/{selectedPeriod === 'yearly' ? 'year' : selectedPeriod === 'monthly' ? 'month' : 'week'}</span>
                        </div>
                      </div>

                      <ul className="features-list">
                        {planData.features.map((feature, idx) => (
                          <li key={idx}>
                            <Check size={16} />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {isCurrent ? (
                        <div className="current-plan-badge">
                          <Zap size={16} />
                          Current Plan
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedPlan(planKey);
                            handleSubscribe();
                          }}
                          disabled={processing}
                          className="subscribe-btn"
                        >
                          {isUpgrade ? 'Upgrade' : isActive ? 'Switch Plan' : 'Subscribe'}
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Dev Mode Mock Activate */}
            {isDev && !isActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="dev-section"
              >
                <Card>
                  <h3>🛠️ Developer Mode</h3>
                  <p>Instantly activate subscription without payment (MOCK mode only)</p>
                  <Button onClick={handleMockActivate} disabled={processing}>
                    Simulate Success - Activate {PLANS[selectedPlan]?.name} ({formatPeriod(selectedPeriod)})
                  </Button>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Billing;
