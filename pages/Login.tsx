
import React, { useState } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { GraduationCap, ArrowRight, UserCircle2, Lock, Mail, BookOpen, School, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifyingSignup, setIsVerifyingSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'verify' | 'reset' | 'success'>('idle');
  const [resetError, setResetError] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login Flow - Using Email
        const user = await api.login(email, password, role);

        if (user) {
          // Check if role matches what user selected in UI (Double Check)
          if (user.role !== role) {
             setError(`This account is registered as ${user.role}. Please switch tabs.`);
             return;
          }
          onLogin(user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Signup Flow
        const response = await api.signup({
          username,
          name: username, // Using username as name since full name is removed
          email,
          role
        }, password);

        if (response && 'requiresVerification' in response && response.requiresVerification) {
            setIsVerifyingSignup(true);
            setSignupEmail(response.email || email);
            setError('');
        } else if (response) {
            onLogin(response as User);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
          const user = await api.verifySignup(signupEmail, signupOtp);
          onLogin(user);
      } catch (err: any) {
          setError(err.message || 'Verification failed');
      } finally {
          setLoading(false);
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    try {
        if (resetStatus === 'idle') {
            setResetStatus('sending');
            await api.forgotPassword(resetEmail);
            setResetStatus('verify');
        } else if (resetStatus === 'verify') {
            await api.verifyResetCode(resetEmail, resetCode);
            setResetStatus('reset');
        } else if (resetStatus === 'reset') {
            await api.resetPassword(resetEmail, resetCode, newPassword);
            setResetStatus('success');
        }
    } catch (err: any) {
        setResetError(err.message || 'Action failed');
        // If sending failed, go back to idle but keep error
        if (resetStatus === 'sending') setResetStatus('idle');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setIsForgotPassword(false);
    setIsVerifyingSignup(false);
    // Clear inputs
    setEmail('');
    setUsername('');
    setPassword('');
  };

  const resetView = () => {
      setIsForgotPassword(false);
      setResetStatus('idle');
      setResetEmail('');
      setError('');
  };

  const getHeaderTitle = () => {
    if (isForgotPassword) return 'Reset Password';
    if (isVerifyingSignup) return 'Verify Email';
    if (!isLogin) return 'Create Account';
    return role === UserRole.STUDENT ? 'Hi Student' : 'Hi Instructor';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-900">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-float"></div>
      </div>

      <div className="glass-panel w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/10 relative transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
        
        <div className="p-8 pb-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30 transform rotate-3 hover:rotate-6 transition-transform">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight transition-all">
            {getHeaderTitle()}
          </h1>
          <p className="text-gray-400 text-sm">
            {isForgotPassword 
                ? 'Recover access to your Spheronix account.' 
                : isVerifyingSignup 
                ? 'Enter the code sent to your email to verify your account.'
                : (isLogin ? 'Enter your credentials to access the portal.' : 'Join Spheronix Training Tracks today.')
            }
          </p>
        </div>
        
        <div className="p-8 pt-2">
            {isVerifyingSignup ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {error && (
                        <div className="bg-red-500/10 text-red-300 text-xs p-3 rounded-lg border border-red-500/20 mb-4 flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></div>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleVerifySignup} className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                            <p className="text-xs text-blue-200 leading-relaxed">
                                A verification code has been sent to <b>{signupEmail}</b>. Please enter it below to complete your registration.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input
                                type="text"
                                value={signupOtp}
                                onChange={(e) => setSignupOtp(e.target.value)}
                                className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl transition-all text-sm tracking-widest text-center font-mono"
                                placeholder="123456"
                                required
                                maxLength={6}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? 'Verifying...' : 'Verify Email & Create Account'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsVerifyingSignup(false)}
                            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm py-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Signup
                        </button>
                    </form>
                </div>
            ) : isForgotPassword ? (
                // Forgot Password View
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {resetError && (
                        <div className="bg-red-500/10 text-red-300 text-xs p-3 rounded-lg border border-red-500/20 mb-4 flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></div>
                            {resetError}
                        </div>
                    )}

                    {resetStatus === 'success' ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/30">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-lg">Password Reset!</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Your password has been updated successfully. You can now login with your new credentials.
                                </p>
                            </div>
                            <button 
                                onClick={resetView}
                                className="w-full py-3 rounded-xl text-white font-semibold bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-sm"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {resetStatus === 'idle' || resetStatus === 'sending' ? (
                                <>
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                                        <p className="text-xs text-blue-200 leading-relaxed">
                                            Enter the email address associated with your account and we'll send you a code to reset your password.
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            </div>
                                            <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl transition-all text-sm"
                                            placeholder="Enter your email"
                                            required
                                            disabled={resetStatus === 'sending'}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={resetStatus === 'sending'}
                                        className="w-full py-3 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group mt-2"
                                    >
                                        {resetStatus === 'sending' ? (
                                            <span className="animate-pulse text-sm">Sending Code...</span>
                                        ) : (
                                            <>
                                            <span className="text-sm">Send Verification Code</span> 
                                            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : resetStatus === 'verify' ? (
                                <>
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                                        <p className="text-xs text-purple-200 leading-relaxed">
                                            A verification code has been sent to <b>{resetEmail}</b> from <i>spheronixtechnology@gmail.com</i>. Please enter it below.
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            </div>
                                            <input
                                            type="text"
                                            value={resetCode}
                                            onChange={(e) => setResetCode(e.target.value)}
                                            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl transition-all text-sm tracking-widest text-center font-mono"
                                            placeholder="123456"
                                            required
                                            maxLength={6}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 transition-all bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 hover:shadow-purple-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group mt-2"
                                    >
                                        <span className="text-sm">Verify Code</span> 
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-4">
                                        <p className="text-xs text-cyan-200 leading-relaxed">
                                            Code verified. Please create a strong new password (min 8 chars, 1 uppercase, 1 number, 1 symbol).
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                            </div>
                                            <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl transition-all text-sm"
                                            placeholder="New Password"
                                            required
                                            minLength={8}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3 rounded-xl text-white font-semibold shadow-lg shadow-green-500/25 transition-all bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group mt-2"
                                    >
                                        <span className="text-sm">Reset Password</span> 
                                        <CheckCircle2 className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </>
                            )}

                            <button 
                                type="button"
                                onClick={resetView}
                                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm py-2 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Cancel
                            </button>
                        </form>
                    )}
                </div>
            ) : (
                // Login / Signup Form
                <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    {error && (
                    <div className="bg-red-500/10 text-red-300 text-xs p-3 rounded-lg border border-red-500/20 flex items-center animate-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></div>
                        {error}
                    </div>
                    )}
                    
                    {/* Common Field: Email */}
                    <div className="space-y-1">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl transition-all text-sm"
                            placeholder="Email Address"
                            required
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        // Signup Field: Username (Full Name removed)
                        <div className="space-y-1 animate-in fade-in slide-in-from-bottom-3">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserCircle2 className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl transition-all text-sm"
                            placeholder="Username"
                            required={!isLogin}
                            />
                        </div>
                        </div>
                    )}

                    <div className="space-y-1">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl transition-all text-sm"
                        placeholder="Password"
                        required
                        />
                    </div>
                    </div>

                    {isLogin && (
                        <div className="flex justify-end">
                            <button 
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    {/* Role Toggle Button (Moved to bottom) */}
                    <div className="flex bg-black/20 p-1 rounded-xl relative mb-2">
                        <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg transition-all duration-300 shadow-lg ${role === UserRole.INSTRUCTOR ? 'left-[calc(50%+4px)]' : 'left-1'}`}
                        ></div>
                        <button 
                        type="button"
                        onClick={() => setRole(UserRole.STUDENT)}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors ${role === UserRole.STUDENT ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                        <School className="w-4 h-4" /> Student
                        </button>
                        <button 
                        type="button"
                        onClick={() => setRole(UserRole.INSTRUCTOR)}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors ${role === UserRole.INSTRUCTOR ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                        <BookOpen className="w-4 h-4" /> Instructor
                        </button>
                    </div>

                    <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group mt-2"
                    >
                    {loading ? (
                        <span className="animate-pulse text-sm">Processing...</span>
                    ) : (
                        <>
                        <span className="text-sm">{isLogin ? 'Sign In' : 'Create Account'}</span> 
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                    </button>
                    
                    <div className="pt-4 text-center border-t border-white/5">
                    <p className="text-xs text-gray-400 mb-3">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                    </p>
                    <button 
                        type="button" 
                        onClick={toggleMode}
                        className="text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition-colors hover:underline"
                    >
                        {isLogin ? "Sign Up Now" : "Login Here"}
                    </button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
