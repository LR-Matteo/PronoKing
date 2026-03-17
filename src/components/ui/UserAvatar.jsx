/**
 * Affiche l'avatar d'un utilisateur.
 * Si un emoji est défini → emoji dans un cercle coloré.
 * Sinon → première lettre du pseudo.
 */
export default function UserAvatar({ user, size = 36 }) {
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const emoji = user?.avatar;

  return (
    <div
      className="user-avatar"
      style={{ width: size, height: size, fontSize: emoji ? size * 0.55 : size * 0.4 }}
      title={user?.username}
    >
      {emoji || initial}
    </div>
  );
}
