import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { EMAILS } from '../lib/constants';

// Email set in Admin → Settings; falls back to the built-in address until the API answers (or if unset)
export function useContactEmail() {
  const { data } = useQuery({
    queryKey: ['site-settings'], // shared with Home, same response shape
    queryFn: () => api.get('/public/settings').then((r) => r.data.settings),
  });
  return data?.contact_email?.trim() || EMAILS[0];
}
