import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const { user, login, signup } = useAuth();
  const [email,setEmail]=useState("");
  const [pwd,setPwd]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [user, nav]);

  const doLogin = async () => {
    try { setErr(""); await login(email, pwd); }
    catch(e){ setErr(e.code || "login_failed"); }
  };
  const doSignup = async () => {
    try { setErr(""); await signup(email, pwd, name); }
    catch(e){ setErr(e.code || "signup_failed"); }
  };

  return (
    <div style={{padding:24, display:"grid", gap:8, maxWidth:360}}>
      <h2>Login</h2>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
      <button onClick={doLogin}>Login</button>
      <hr/>
      <h3>Signup</h3>
      <input placeholder="display name" value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={doSignup}>Create account</button>
      {err && <div style={{color:"red"}}>{err}</div>}
    </div>
  );
}
