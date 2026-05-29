import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { SWYMBLE_DATA } from '../data/config';
import { buildGmailComposeUrl, buildMailtoHref, isMailtoLink } from '../utils/mailto';

export function useDesktopContactForm() {
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
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

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
    const value = sanitizeInput(event.target.value);
    setName(value);
    setNameError(value ? validateName(value) : '');
    resetFeedback();
  };

  const handleProjectChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(event.target.value);
    setProject(value);
    setProjectError(value ? validateProject(value) : '');
    resetFeedback();
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(event.target.value);
    setEmail(value);
    setEmailError(value ? validateEmail(value) : '');
    resetFeedback();
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
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
      const contactMailto = SWYMBLE_DATA.socials.find((social) => social.id === 'em' && isMailtoLink(social.link))?.link;

      if (!contactMailto) {
        throw new Error('Missing contact email');
      }

      const composeUrl = buildGmailComposeUrl(
        buildMailtoHref(contactMailto, {
          subject: `New inquiry from ${cleanName} via Swymble`,
          body: [`Name: ${cleanName}`, `Email: ${cleanEmail}`, `Looking to build: ${cleanProject}`].join('\n'),
        }),
      );

      const openedWindow = window.open(composeUrl, '_blank');

      if (openedWindow) {
        openedWindow.opener = null;
      } else {
        window.location.href = composeUrl;
      }

      setFormStatus('success');
      setFormMessage({ type: 'success', text: 'Your email draft is open. Hit send when it looks right.' });
      lastSubmittedAtRef.current = Date.now();
      formStartedAtRef.current = Date.now();
    } catch {
      setFormStatus('error');
      setFormMessage({ type: 'error', text: 'Unable to open email. Please use hello@swymble.com.' });
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
