import { useState, FormEvent } from 'react';   
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
console.log('Initializing EmailJS...');
console.log('Service ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID);
console.log('Template ID:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
console.log('Public Key:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

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
  
  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('umutdncr@gmail.com');
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
            to_email: 'umutdncr@gmail.com',
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
          setTimeout(() => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#141414] w-[700px] rounded-xl p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.6)]">
        <div className="bg-[#141414] rounded-[10px] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-semibold text-white font-manrope">Mail to Umut</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isSending}
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-manrope">From:</label>
                <input 
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-manrope"
                  placeholder="Enter your email"
                />
                {errors.fromEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.fromEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-manrope">To:</label>
                <div className="relative group">
                  <input 
                    type="text"
                    value={showCopied ? "Copied!" : "umutdincer@gmail.com"}
                    readOnly
                    onClick={handleCopyEmail}
                    className={`w-full bg-[#1a1a1a] text-gray-400 rounded-lg px-4 py-3 cursor-pointer hover:bg-[#242424] transition-all duration-300 font-manrope relative ${!showCopied && 'group-hover:text-transparent'}`}
                  />
                  <div className={`absolute inset-0 flex items-center px-4 py-3 opacity-0 transition-all duration-300 pointer-events-none ${!showCopied && 'group-hover:opacity-100'}`}>
                    <span className="text-gray-400">Click to Copy</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2 font-manrope">Subject</label>
              <input 
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-manrope"
                placeholder="Enter subject"
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2 font-manrope">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-manrope h-48 resize-none"
                placeholder="Type your message here..."
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors font-manrope disabled:opacity-50"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-7 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-manrope flex items-center gap-2 disabled:opacity-50 ${
                  sendStatus === 'success' ? 'bg-green-500 hover:bg-green-600' :
                  sendStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : ''
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
    </div>
  );
};

export default EmailPopup; 