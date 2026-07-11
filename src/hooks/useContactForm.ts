import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { SWYMBLE_DATA } from '../data/config';
import { isMailtoLink } from '../utils/mailto';

const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT ?? 'https://swymble.com/api/contact';
const MAILTO_PREFIX = 'mailto:';

type ContactApiResponse = {
  ok?: boolean;
  error?: string;
  fields?: { name?: string; email?: string; project?: string };
};

function getFallbackContactEmail() {
  const contactMailto = SWYMBLE_DATA.socials.find((social) => social.id === 'em' && isMailtoLink(social.link))?.link;
  if (!contactMailto) return 'hello@swymble.com';
  return contactMailto.slice(MAILTO_PREFIX.length).split('?')[0] || 'hello@swymble.com';
}

export function useContactForm() {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formStartedAtRef = useRef<number>(Date.now());
  const lastSubmittedAtRef = useRef<number>(0);

  const sanitizeInput = (value: string) =>
    value
      .replace(/[<>]/g, '')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Light pass for onChange: strips disallowed characters only, without
  // collapsing whitespace or trimming, so users can type spaces mid-sentence.
  const sanitizeInputLight = (value: string) => value.replace(/[<>]/g, '').replace(/[\x00-\x1F\x7F]/g, ' ');

  const validateName = (value: string) => {
    if (!value) return 'name is required';
    if (value.length < 2) return 'name must be at least 2 characters';
    if (value.length > 60) return 'name must be 60 characters or less';
    if (!/^[a-zA-Z][a-zA-Z\s'.,-]*$/.test(value)) return 'name contains invalid characters';
    return '';
  };

  const validateProject = (value: string) => {
    if (!value) return 'project details are required';
    if (value.length < 3) return 'project details are too short';
    if (value.length > 120) return 'project details must be 120 characters or less';
    return '';
  };

  const validateEmail = (value: string) => {
    if (!value) return 'email is required';
    if (value.length > 120) return 'email must be 120 characters or less';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'please enter a valid email address';
    return '';
  };

  const resetFeedback = () => {
    if (formStatus !== 'idle') setFormStatus('idle');
    if (formMessage) setFormMessage(null);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInputLight(event.target.value);
    setName(value);
    const trimmed = value.trim();
    setNameError(trimmed ? validateName(trimmed) : '');
    resetFeedback();
  };

  const handleProjectChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInputLight(event.target.value);
    setProject(value);
    const trimmed = value.trim();
    setProjectError(trimmed ? validateProject(trimmed) : '');
    resetFeedback();
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInputLight(event.target.value);
    setEmail(value);
    const trimmed = value.trim();
    setEmailError(trimmed ? validateEmail(trimmed) : '');
    resetFeedback();
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const now = Date.now();
    const formData = new FormData(event.currentTarget);
    const botField = String(formData.get('website') ?? '').trim();

    if (botField) {
      setFormStatus('success');
      setFormMessage({ type: 'success', text: "Message received. I'll be in touch soon." });
      return;
    }

    if (now - formStartedAtRef.current < 3000) {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Please take a moment to complete the form.' });
      return;
    }

    if (now - lastSubmittedAtRef.current < 30000) {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Please wait 30 seconds before sending another message.' });
      return;
    }

    const cleanName = sanitizeInput(name);
    const cleanProject = sanitizeInput(project);
    const cleanEmail = sanitizeInput(email);

    const nextNameError = validateName(cleanName);
    const nextProjectError = validateProject(cleanProject);
    const nextEmailError = validateEmail(cleanEmail);

    setName(cleanName);
    setProject(cleanProject);
    setEmail(cleanEmail);
    setNameError(nextNameError);
    setProjectError(nextProjectError);
    setEmailError(nextEmailError);

    if (nextNameError || nextProjectError || nextEmailError) {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Please fix the highlighted fields and try again.' });
      return;
    }

    setFormStatus('sending');
    setFormMessage(null);

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          project: cleanProject,
          website: botField,
          startedAt: formStartedAtRef.current,
        }),
        signal: AbortSignal.timeout(10000),
      });

      let json: ContactApiResponse = {};
      try {
        json = (await response.json()) as ContactApiResponse;
      } catch {
        json = {};
      }

      if (response.ok && json.ok) {
        setFormStatus('success');
        setFormMessage({ type: 'success', text: "Message sent. I'll get back to you within 24 hours." });
        setName('');
        setProject('');
        setEmail('');
        lastSubmittedAtRef.current = Date.now();
        formStartedAtRef.current = Date.now();
        return;
      }

      if (response.status === 422) {
        const serverFields = json.fields ?? {};
        if (serverFields.name) setNameError(serverFields.name);
        if (serverFields.email) setEmailError(serverFields.email);
        if (serverFields.project) setProjectError(serverFields.project);
        setFormStatus('error');
        setFormMessage({ type: 'error', text: 'Please fix the highlighted fields and try again.' });
        return;
      }

      if (response.status === 429) {
        setFormStatus('error');
        setFormMessage({
          type: 'error',
          text: 'Too many messages right now. Please try again in a few minutes.',
        });
        return;
      }

      throw new Error('delivery_failed');
    } catch {
      setFormStatus('error');
      setFormMessage({
        type: 'error',
        text: `Couldn't send right now. Email me directly at ${getFallbackContactEmail()}.`,
      });
    }
  };

  return {
    name,
    nameError,
    handleNameChange,
    project,
    projectError,
    handleProjectChange,
    email,
    emailError,
    handleEmailChange,
    formStatus,
    formMessage,
    handleFormSubmit,
  };
}
