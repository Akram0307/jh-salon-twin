import { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general';
  subject: string;
  message: string;
  email?: string;
  screenshot?: string;
  page: string;
  userAgent: string;
  timestamp: string;
}

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: '🐛', color: 'oklch(0.70 0.18 15)' },
  { id: 'feature', label: 'Feature Request', icon: '💡', color: 'oklch(0.723 0.219 149)' },
  { id: 'general', label: 'General Feedback', icon: '💬', color: 'oklch(0.623 0.214 259)' },
] as const;

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const captureScreenshot = async () => {
    try {
      // Use html2canvas if available, otherwise just note that screenshot was requested
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // For now, we'll just set a placeholder - full implementation would use html2canvas
      setScreenshot('screenshot_requested');
    } catch (error) {
      console.error('Screenshot capture failed:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitFeedback = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const feedbackData: FeedbackData = {
      type: feedbackType,
      subject: subject || `${FEEDBACK_TYPES.find(t => t.id === feedbackType)?.label}`,
      message,
      email: email || undefined,
      screenshot: screenshot || undefined,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post(`${API_BASE}/api/feedback`, feedbackData);
      setSubmitStatus('success');
      // Reset form after success
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus('idle');
        setSubject('');
        setMessage('');
        setEmail('');
        setScreenshot(null);
        setFeedbackType('general');
      }, 2000);
    } catch (error) {
      console.error('Feedback submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open feedback form"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'oklch(0.623 0.214 259)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          zIndex: 9999,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        }}
      >
        💬
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'oklch(0.208 0.011 247)' }}>
                Send Feedback
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close feedback form"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: 'oklch(0.446 0.017 247)',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Feedback Type Selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'oklch(0.208 0.011 247)' }}>
                Feedback Type
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFeedbackType(type.id)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: feedbackType === type.id ? `2px solid ${type.color}` : '1px solid oklch(0.929 0.009 247)',
                      background: feedbackType === type.id ? 'oklch(0.968 0.005 247)' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'oklch(0.208 0.011 247)' }}>
                Subject (optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary..."
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid oklch(0.929 0.009 247)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Message Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'oklch(0.208 0.011 247)' }}>
                Message <span style={{ color: 'oklch(0.70 0.18 15)' }}>*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}
                required
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid oklch(0.929 0.009 247)',
                  fontSize: 14,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'oklch(0.208 0.011 247)' }}>
                Email (optional, for follow-up)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid oklch(0.929 0.009 247)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Screenshot Section */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'oklch(0.208 0.011 247)' }}>
                Screenshot (optional)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={captureScreenshot}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid oklch(0.929 0.009 247)',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  📷 Capture
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid oklch(0.929 0.009 247)',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  📁 Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                {screenshot && (
                  <span style={{ display: 'flex', alignItems: 'center', color: 'oklch(0.723 0.219 149)', fontSize: 14 }}>
                    ✓ Attached
                  </span>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'oklch(0.96 0.05 145)',
                  color: 'oklch(0.40 0.15 145)',
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                ✓ Thank you for your feedback!
              </div>
            )}
            {submitStatus === 'error' && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'oklch(0.96 0.05 25)',
                  color: 'oklch(0.50 0.18 25)',
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                ✗ Failed to submit. Please try again.
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={submitFeedback}
              disabled={!message.trim() || isSubmitting}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: 'none',
                background: message.trim() ? 'oklch(0.623 0.214 259)' : 'oklch(0.929 0.009 247)',
                color: message.trim() ? 'white' : 'oklch(0.446 0.017 247)',
                fontSize: 16,
                fontWeight: 600,
                cursor: message.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {isSubmitting ? 'Sending...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
