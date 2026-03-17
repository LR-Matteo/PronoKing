/**
 * Affiche l'avatar d'un utilisateur.
 * - Si avatar est une image (data: ou http) → <img> dans un cercle
 * - Si avatar est un emoji → emoji dans un cercle doré
 * - Sinon → première lettre du pseudo
 */
export default function UserAvatar({ user, size = 36 }) {
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const avatar = user?.avatar;

  const isImage = avatar && (avatar.startsWith('data:') || avatar.startsWith('http'));
  const isEmoji = avatar && !isImage;

  return (
    <div
      className={`user-avatar ${isImage ? 'user-avatar-img' : ''}`}
      style={{ width: size, height: size, fontSize: isEmoji ? size * 0.55 : size * 0.4 }}
      title={user?.username}
    >
      {isImage ? (
        <img src={avatar} alt={user?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        isEmoji ? avatar : initial
      )}
    </div>
  );
}
