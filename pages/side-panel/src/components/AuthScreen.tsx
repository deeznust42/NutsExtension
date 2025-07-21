import { useState } from 'react';
import { devMojoAuth } from '../services/mojoAuth';

interface AuthScreenProps {
  onVerificationSuccess: (email: string) => void;
  isDarkMode: boolean;
}

const AuthScreen = ({ onVerificationSuccess, isDarkMode }: AuthScreenProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate email domain
  const validateEmail = (emailInput: string): boolean => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    return trimmedEmail.endsWith('@seecs.edu.pk') && trimmedEmail.includes('@');
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email domain
    if (!validateEmail(email)) {
      setError('Please use a valid nust email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Use MojoAuth service to send OTP
      const result = await devMojoAuth.sendEmailOTP(email);

      if (result.success) {
        setStep('otp');
        setError('');
      } else {
        setError(result.message || 'Failed to send verification code. Please try again.');
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
      console.error('Email verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setIsLoading(true);

    try {
      // Use MojoAuth service to verify OTP
      const result = await devMojoAuth.verifyEmailOTP(email, otp);

      if (result.success) {
        // On success, call the parent success handler
        onVerificationSuccess(email);
      } else {
        setError(result.message || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      console.error('OTP verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to email step
  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  return (
    <div
      className={`flex h-screen flex-col items-center justify-center p-8 ${isDarkMode ? 'bg-slate-900' : 'bg-[#1a2550]'}`}>
      <div
        className={`w-full max-w-md rounded-2xl border p-8 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#22306a] bg-[#1a2550]'}`}>
        {/* Logo and Header */}
        <div className="mb-8 text-center">
          <img src="/icon-128.png" alt="Nanobrowser Logo" className="mx-auto mb-4 size-16" />
          <h2 className={`mb-2 text-2xl font-bold ${isDarkMode ? 'text-sky-200' : 'text-[#7dd3fc]'}`}>
            Verify Your Access
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-sky-300' : 'text-[#7dd3fc]/80'}`}>
            {step === 'email'
              ? 'Enter your nust email to get started'
              : 'Enter the verification code sent to your email'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${isDarkMode ? 'border-red-600 bg-red-900/20 text-red-400' : 'border-red-400 bg-red-500/10 text-red-300'}`}>
            {error}
          </div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDarkMode ? 'text-sky-300' : 'text-[#7dd3fc]'}`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@seecs.edu.pk"
                disabled={isLoading}
                className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'
                    : 'border-[#22306a] bg-[#0f1629] text-[#7dd3fc] placeholder-[#7dd3fc]/50 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20'
                }`}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
                isDarkMode
                  ? 'bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-600 disabled:text-slate-400'
                  : 'bg-[#38bdf8] text-white hover:bg-[#0ea5e9] disabled:bg-[#22306a] disabled:text-[#7dd3fc]/50'
              }`}>
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDarkMode ? 'text-sky-300' : 'text-[#7dd3fc]'}`}>
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} // Only digits, max 6
                placeholder="Enter 6-digit code"
                disabled={isLoading}
                className={`w-full rounded-lg border px-4 py-3 text-center text-lg tracking-widest transition-colors ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'
                    : 'border-[#22306a] bg-[#0f1629] text-[#7dd3fc] placeholder-[#7dd3fc]/50 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20'
                }`}
                maxLength={6}
                required
              />
              <p className={`mt-2 text-xs ${isDarkMode ? 'text-sky-400' : 'text-[#7dd3fc]/60'}`}>
                Code sent to: {email}
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
                isDarkMode
                  ? 'bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-600 disabled:text-slate-400'
                  : 'bg-[#38bdf8] text-white hover:bg-[#0ea5e9] disabled:bg-[#22306a] disabled:text-[#7dd3fc]/50'
              }`}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={handleBackToEmail}
              disabled={isLoading}
              className={`w-full rounded-lg border px-4 py-3 font-medium transition-colors ${
                isDarkMode
                  ? 'border-slate-600 text-sky-300 hover:bg-slate-700 disabled:text-slate-500'
                  : 'border-[#22306a] text-[#7dd3fc] hover:bg-[#22306a] disabled:text-[#7dd3fc]/50'
              }`}>
              Back to Email
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-xs ${isDarkMode ? 'text-sky-400' : 'text-[#7dd3fc]/60'}`}>
            Limited to Nust students and faculty.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
