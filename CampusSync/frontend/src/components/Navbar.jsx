export default function Navbar({ active, setActive, user, onLogout }) {
  const tabs = ["Dashboard", "Q&A", "Squad Finder", "Events", "Notifications"];

  return (
    <div className="navbar">
      <h1 className="brand">CampusSync</h1>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={active === tab ? "active" : ""}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="profile">
        <span className="user-badge">{user?.name}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
