import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");

  return (
    <div style={{ padding: 24, display: "grid", gap: 8, maxWidth: 360 }}>
      <h2>Login</h2>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
      <button onClick={() => login(email, pwd)}>Login</button>
      <hr/>
      <h3>Signup</h3>
      <input placeholder="display name" value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={() => signup(email, pwd, name)}>Create account</button>
    </div>
  );
}
