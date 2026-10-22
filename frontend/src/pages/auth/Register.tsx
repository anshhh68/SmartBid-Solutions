import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Public registration is disabled for SmartBid Solutions.
 * Users who land here (e.g. via old links) are redirected to /contact.
 * The router in App.tsx already redirects /register → /contact,
 * but this component handles any direct renders of the Register route.
 */
export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/contact', { replace: true });
  }, [navigate]);

  return null;
}
