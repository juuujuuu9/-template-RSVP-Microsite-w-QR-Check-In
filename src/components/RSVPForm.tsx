import { useState, type FormEvent } from 'react';

export default function RSVPForm(): JSX.Element {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          terms,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong.');
        return;
      }
      setStatus('success');
      setMessage(data.message ?? 'Thank you! Your RSVP has been received.');
      setFirstName('');
      setLastName('');
      setEmail('');
      setTerms(false);
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rsvp-form">
      <div className="form-row">
        <label htmlFor="firstName">First name</label>
        <input
          id="firstName"
          type="text"
          required
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={status === 'submitting'}
        />
      </div>
      <div className="form-row">
        <label htmlFor="lastName">Last name</label>
        <input
          id="lastName"
          type="text"
          required
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={status === 'submitting'}
        />
      </div>
      <div className="form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
        />
      </div>
      <div className="form-row checkbox-row">
        <input
          id="terms"
          type="checkbox"
          required
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          disabled={status === 'submitting'}
        />
        <label htmlFor="terms">I agree to the terms and conditions</label>
      </div>
      {message && (
        <p role="alert" className={`form-message ${status === 'error' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      <button type="submit" disabled={status === 'submitting'} className="submit-btn">
        {status === 'submitting' ? 'Sending…' : 'Submit RSVP'}
      </button>
    </form>
  );
}
