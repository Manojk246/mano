import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [tab, setTab] = useState('admin');
  const navigate = useNavigate();

  return (
    <div style={{minHeight:'100vh',margin:0,padding:0,fontFamily:'Poppins, sans-serif',display:'flex',justifyContent:'center',alignItems:'center',background:'linear-gradient(-45deg, #00c6ff, #0072ff, #6a00f4, #b400ff)',backgroundSize:'400% 400%'}}>
      <div style={{background:'rgba(255, 255, 255, 0.15)',backdropFilter:'blur(12px)',borderRadius:25,boxShadow:'0 0 40px rgba(0, 0, 0, 0.3)',width:400,padding:'40px 30px',textAlign:'center',color:'#fff'}}>
        <h2 style={{fontSize:'2rem',marginBottom:15,fontWeight:600}}>Login Portal</h2>

        <div style={{display:'flex',justifyContent:'space-around',marginBottom:25}}>
          {['admin','trainer','user'].map(role => (
            <button key={role} onClick={()=>setTab(role)} style={{flex:1,padding:'10px 5px',border:'none',borderRadius:10,background: tab===role ? 'linear-gradient(90deg, #00e5ff, #0072ff)' : 'rgba(255,255,255,0.2)',color:'#fff',fontWeight:600,fontSize:'1rem',cursor:'pointer',transition:'background 0.3s ease',margin:'0 5px'}}>
              {role[0].toUpperCase()+role.slice(1)}
            </button>
          ))}
        </div>

        {tab==='admin' && (
          <form onSubmit={(e)=>{e.preventDefault(); navigate('/admin');}}>
            <input type="email" placeholder="Admin Email" required style={inputStyle} />
            <input type="password" placeholder="Password" required style={inputStyle} />
            <button type="submit" style={loginBtnStyle}>Login as Admin</button>
          </form>
        )}

        {tab==='trainer' && (
          <form onSubmit={(e)=>{e.preventDefault();}}>
            <input type="email" placeholder="Trainer Email" required style={inputStyle} />
            <input type="password" placeholder="Password" required style={inputStyle} />
            <button type="submit" style={loginBtnStyle}>Login as Trainer</button>
          </form>
        )}

        {tab==='user' && (
          <form onSubmit={(e)=>{e.preventDefault();}}>
            <input type="email" placeholder="User Email" required style={inputStyle} />
            <input type="password" placeholder="Password" required style={inputStyle} />
            <button type="submit" style={loginBtnStyle}>Login as User</button>
          </form>
        )}

        <div style={{marginTop:20,fontSize:'0.9rem',color:'rgba(255,255,255,0.85)'}}>Don’t have an account? <button type="button" style={{color:'#00e5ff',background:'transparent',border:'none',cursor:'pointer',fontWeight:600,textDecoration:'none'}}>Sign up</button></div>
        <Link to="/" style={{display:'inline-block',marginTop:25,padding:'10px 18px',border:'none',borderRadius:10,background:'rgba(255, 255, 255, 0.2)',color:'#fff',fontWeight:600,textDecoration:'none'}}>⬅ Back to Home</Link>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  margin: '10px 0',
  border: 'none',
  borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.2)',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none'
};

const loginBtnStyle = {
  width: '100%',
  padding: 12,
  border: 'none',
  borderRadius: 10,
  background: 'linear-gradient(90deg, #00e5ff, #0072ff)',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer'
};


