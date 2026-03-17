import { format, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(iso) {
  return format(new Date(iso), "d MMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatDateShort(iso) {
  return format(new Date(iso), 'd MMM HH:mm', { locale: fr });
}

export function isMatchStarted(kickoff) {
  return isPast(new Date(kickoff));
}

export function isMatchUpcoming(kickoff) {
  return isFuture(new Date(kickoff));
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}
