// MojoAuth Service Configuration
// Replace the placeholder API key with your actual MojoAuth API key
//
// To get your API key:
// 1. Sign up at https://mojoauth.com
// 2. Go to your dashboard
// 3. Copy your API key (there's no separate "API secret" - just the API key)
// 4. Replace 'YOUR_MOJOAUTH_API_KEY_HERE' below with your actual key

interface MojoAuthConfig {
  apiKey: string;
  source: Array<{ type: string; feature: string }>;
  serverUrl?: string;
}

// TODO: Replace with your actual MojoAuth API key
const MOJOAUTH_CONFIG: MojoAuthConfig = {
  apiKey: '20ed1921-5a43-47b4-9062-28decf9a51a1', // Replace with your actual API key from MojoAuth dashboard
  source: [{ type: 'email', feature: 'otp' }], // Email OTP authentication method
  serverUrl: 'https://api.mojoauth.com', // Default MojoAuth API URL
};

interface EmailOTPResponse {
  success: boolean;
  message?: string;
  identifier?: string;
  state_id?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  user?: {
    email: string;
    identifier: string;
  };
}

class MojoAuthService {
  private config: MojoAuthConfig;
  private stateId: string | null = null; // Store state_id from email OTP response

  constructor(config: MojoAuthConfig) {
    this.config = config;
  }

  /**
   * Send OTP to email address
   * @param email - Email address to send OTP to
   * @returns Promise with response
   */
  async sendEmailOTP(email: string): Promise<EmailOTPResponse> {
    try {
      // TODO: Replace this simulation with actual MojoAuth API call
      console.log('MojoAuth: Sending OTP to', email);

      // MojoAuth API call for sending email OTP
      const response = await fetch(`${this.config.serverUrl}/users/emailotp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store state_id for verification
      this.stateId = data.state_id;

      return {
        success: true,
        message: data.message || 'OTP sent successfully',
        identifier: data.state_id,
      };
    } catch (error) {
      console.error('MojoAuth sendEmailOTP error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP for email
   * @param email - Email address
   * @param otp - OTP code to verify
   * @returns Promise with verification response
   */
  async verifyEmailOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      // TODO: Replace this simulation with actual MojoAuth API call
      console.log('MojoAuth: Verifying OTP', otp, 'for email', email);

      // Ensure we have a state_id from the previous email OTP request
      if (!this.stateId) {
        throw new Error('No state_id available. Please request OTP first.');
      }

      // MojoAuth API call for verifying email OTP
      const response = await fetch(`${this.config.serverUrl}/users/emailotp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          state_id: this.stateId,
          otp: otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('MojoAuth verification error:', response.status, errorData);
        throw new Error(errorData.message || `Verification failed: ${response.status}`);
      }

      const data = await response.json();

      // Clear state_id after successful verification
      this.stateId = null;

      return {
        success: true,
        message: data.message || 'OTP verified successfully',
        user: {
          email: email,
          identifier: data.identifier || data.id || data.user_id,
        },
      };
    } catch (error) {
      console.error('MojoAuth verifyEmailOTP error:', error);
      // Clear state_id on error to allow retry
      this.stateId = null;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify OTP',
      };
    }
  }

  /**
   * Clear stored state_id (useful for retries)
   */
  clearState(): void {
    this.stateId = null;
  }
}

// Create and export the MojoAuth service instance
export const mojoAuthService = new MojoAuthService(MOJOAUTH_CONFIG);

// Export types for use in components
export type { EmailOTPResponse, VerifyOTPResponse };

// Development/Testing mode - set to false in production
const DEV_MODE = false;

/**
 * Development wrapper functions that simulate MojoAuth API calls
 * Remove these and use mojoAuthService directly in production
 */
export const devMojoAuth = {
  async sendEmailOTP(email: string): Promise<EmailOTPResponse> {
    if (DEV_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success for @seecs.edu.pk and @student.nust.edu.pk emails
      if (email.endsWith('@seecs.edu.pk') || email.endsWith('@student.nust.edu.pk')) {
        console.log('DEV: Simulated OTP sent to', email);
        return {
          success: true,
          message: 'OTP sent successfully (simulated)',
          identifier: `sim_${Date.now()}`,
        };
      } else {
        throw new Error('Invalid email domain');
      }
    }

    return mojoAuthService.sendEmailOTP(email);
  },

  async verifyEmailOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    if (DEV_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success for any 6-digit OTP in development
      if (otp.length === 6 && /^\d{6}$/.test(otp)) {
        console.log('DEV: Simulated OTP verification for', email);
        return {
          success: true,
          message: 'OTP verified successfully (simulated)',
          user: {
            email: email,
            identifier: `user_${Date.now()}`,
          },
        };
      } else {
        throw new Error('Invalid OTP format');
      }
    }

    return mojoAuthService.verifyEmailOTP(email, otp);
  },
};
