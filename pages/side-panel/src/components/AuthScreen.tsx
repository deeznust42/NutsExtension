import { useState } from 'react';
import { devMojoAuth } from '../services/mojoAuth';

interface AuthScreenProps {
  onVerificationSuccess: (email: string) => void;
}

const AuthScreen = ({ onVerificationSuccess }: AuthScreenProps) => {
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
    <div className="flex h-screen flex-col items-center justify-center p-8 bg-[#1a2550]">
      <div className="w-full max-w-md rounded-2xl border p-8 border-[#22306a] bg-[#1a2550]">
        {/* Logo and Header */}
        <div className="mb-8 text-center">
          {step === 'email' && <img src="/icon-128.png" alt="nuts logo" className="mx-auto mb-4 size-16" />}
          <h2 className="mb-2 text-2xl font-bold text-white">
            {step === 'email' ? 'Verify Your Access' : 'Verification Code'}
          </h2>
          <p className="text-sm text-gray-300">
            {step === 'email'
              ? 'Enter your nust email to get started'
              : 'Enter the code sent to your email. (Check spam folder)'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border p-3 text-sm border-red-400 bg-red-500/10 text-red-300">{error}</div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@nust.edu.pk"
                disabled={isLoading}
                className="w-full rounded-lg border px-4 py-3 transition-colors border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full rounded-lg px-4 py-3 font-medium transition-colors bg-white text-gray-900 hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500">
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} // Only digits, max 6
                placeholder="Enter 6-digit code"
                disabled={isLoading}
                className="w-full rounded-lg border px-4 py-3 transition-colors border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
                maxLength={6}
                required
              />
              <p className="mt-2 text-xs text-gray-500">Code sent to: {email}</p>
            </div>
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full rounded-lg px-4 py-3 font-medium transition-colors bg-white text-gray-900 hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500">
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={handleBackToEmail}
              disabled={isLoading}
              className="w-full rounded-lg border px-4 py-3 font-medium transition-colors border-gray-300 text-gray-700 hover:bg-gray-100 disabled:text-gray-400">
              Back to Email
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#7dd3fc]/60">Limited to Nust students and faculty.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
