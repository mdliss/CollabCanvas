import Avatar from './Avatar';

/**
 * PresenceList - Shows all online users with avatars
 * Render every user with avatar + name; show count = users.length
 */
export default function PresenceList({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        background: "rgba(255, 255, 255, 0.95)",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontSize: "14px",
        zIndex: 9998
      }}
    >
      <div style={{ marginBottom: "8px", fontWeight: "600", color: "#333" }}>
        {users.length} online
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {users.map((user) => (
          <div
            key={user.uid}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Avatar 
              src={user.photoURL}
              name={user.displayName}
              color={user.color}
              size="sm"
            />
            <span style={{ color: "#555", fontSize: "13px" }}>
              {user.displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

