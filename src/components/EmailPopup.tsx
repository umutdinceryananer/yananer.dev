import { useEffect, useId, useRef, useState, FormEvent } from 'react';   
import { createPortal } from 'react-dom';
import emailjs from '@emailjs/browser';
import { profile } from '../data/profile';
import { useDialogTransition, dialogChrome } from '../lib/useDialogTransition';
import { useDialogFocus } from '../lib/useDialogFocus';

// Initialize EmailJS with your public key
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

interface EmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmailPopup = ({ isOpen, onClose }: EmailPopupProps) => {
  const [showCopied, setShowCopied] = useState(false);
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { render, shown } = useDialogTransition(isOpen);
  const chrome = dialogChrome(shown);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDialogFocus(render, panelRef);

  // The dialog is mounted for the life of the page and only hides itself, so
  // without this it reopens wearing whatever it wore when it was last closed:
  // a red "Failed to Send" button, stale validation errors, a To field still
  // reading "Copied!". The draft is deliberately kept — a failed send is
  // exactly when you do not want the message thrown away.
  useEffect(() => {
    if (!isOpen) return;
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    setErrors({});
    setSendStatus('idle');
    setShowCopied(false);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    },
    [],
  );

  // Escape is the expected way out of a dialog. Safe to add now that the draft
  // survives a close: reopening restores everything but the transient state.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!render) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setShowCopied(true);
    setTimeout(() => {
      const input = document.querySelector('input[value="Copied!"]') as HTMLElement;
      if (input) {
        input.style.opacity = '0';
        setTimeout(() => {
          setShowCopied(false);
          setTimeout(() => {
            input.style.opacity = '1';
          }, 50);
        }, 300);
      }
    }, 1000);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!fromEmail) {
      newErrors.fromEmail = 'Your email is required';
    } else if (!/\S+@\S+\.\S+/.test(fromEmail)) {
      newErrors.fromEmail = 'Please enter a valid email';
    }
    
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSending(true);
      setSendStatus('idle');

      try {
        const result = await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            from_name: fromEmail,
            from_email: fromEmail,
            to_name: 'Umut',
            to_email: profile.email,
            subject: subject,
            message: message,
            reply_to: fromEmail
          }
        );

        if (result.status === 200) {
          setSendStatus('success');
          // Clear form
          setFromEmail('');
          setSubject('');
          setMessage('');
          // Close popup after 2 seconds
          // Held in a ref so closing by hand before it fires cannot slam a
          // freshly reopened dialog shut two seconds later.
          autoCloseTimer.current = setTimeout(() => {
            autoCloseTimer.current = null;
            onClose();
            setSendStatus('idle');
          }, 2000);
        }
      } catch (error) {
        setSendStatus('error');
        console.error('Failed to send email:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  // Portalled to <body> so the overlay can never be trapped by an ancestor
  // that creates a containing block for fixed positioning (a transform,
  // filter or contain), which would shrink it to that ancestor's box.
  return createPortal(
    <div className={`${chrome.root} p-3 sm:p-4`}>
      <div aria-hidden className={`${chrome.backdrop} bg-black/60`} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${chrome.panel} bg-surface-1 w-full max-w-[700px] max-h-[90vh] overflow-y-auto rounded-xl p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.6)]`}
      >
        <div className="bg-surface-1 rounded-[10px] p-5 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 id={titleId} className="text-2xl font-semibold text-ink">Mail to Umut</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-400 hover:text-ink transition-colors"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${titleId}-from`} className="block text-gray-300 text-sm font-medium mb-2">From:</label>
                <input
                  id={`${titleId}-from`}
                  type="email"
                  aria-invalid={!!errors.fromEmail}
                  aria-describedby={errors.fromEmail ? `${titleId}-from-error` : undefined}
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full bg-surface-2 text-ink rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Enter your email"
                />
                {errors.fromEmail && (
                  <p id={`${titleId}-from-error`} role="alert" className="text-red-500 text-xs mt-1">{errors.fromEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor={`${titleId}-to`} className="block text-gray-300 text-sm font-medium mb-2">To:</label>
                <div className="relative group">
                  <input
                    id={`${titleId}-to`}
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCopyEmail();
                      }
                    }}
                    value={showCopied ? "Copied!" : profile.email}
                    readOnly
                    onClick={handleCopyEmail}
                    className={`w-full bg-surface-2 text-gray-400 rounded-lg px-4 py-3 cursor-pointer hover:bg-surface-4 transition-all duration-300 relative ${!showCopied && 'group-hover:text-transparent'}`}
                  />
                  <div className={`absolute inset-0 flex items-center px-4 py-3 opacity-0 transition-all duration-300 pointer-events-none ${!showCopied && 'group-hover:opacity-100'}`}>
                    <span className="text-gray-400">Click to Copy</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor={`${titleId}-subject`} className="block text-gray-300 text-sm font-medium mb-2">Subject</label>
              <input
                id={`${titleId}-subject`}
                type="text"
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? `${titleId}-subject-error` : undefined}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-surface-2 text-ink rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="Enter subject"
              />
              {errors.subject && (
                <p id={`${titleId}-subject-error`} role="alert" className="text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>
            
            <div>
              <label htmlFor={`${titleId}-message`} className="block text-gray-300 text-sm font-medium mb-2">Message</label>
              <textarea
                id={`${titleId}-message`}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? `${titleId}-message-error` : undefined}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-surface-2 text-ink rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200 h-32 sm:h-48 resize-none"
                placeholder="Type your message here..."
              />
              {errors.message && (
                <p id={`${titleId}-message-error`} role="alert" className="text-red-500 text-xs mt-1">{errors.message}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 font-medium text-gray-300 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-7 py-2.5 font-medium bg-accent-500 hover:bg-accent-600 text-accent-fg rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                  sendStatus === 'success' ? 'bg-green-500 hover:bg-green-600 text-ink' :
                  sendStatus === 'error' ? 'bg-red-500 hover:bg-red-600 text-ink' : ''
                }`}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : sendStatus === 'success' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sent!
                  </>
                ) : sendStatus === 'error' ? (
                  'Failed to Send'
                ) : (
                  'Send Email'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default EmailPopup; 