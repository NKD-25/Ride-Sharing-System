
import {useState} from "react"
import API from "../api"
import {useNavigate,Link} from "react-router-dom"

export default function Login(){

const nav = useNavigate()

const [email,setEmail]=useState("")
const [password,setPassword]=useState("")

const login=async()=>{
const res = await API.post("/auth/login",{email,password})
localStorage.setItem("token",res.data.token)
nav("/dashboard")
}

return(
<div>
<h2>Login</h2>
<input placeholder="email" onChange={e=>setEmail(e.target.value)}/>
<input placeholder="password" type="password" onChange={e=>setPassword(e.target.value)}/>
<button onClick={login}>Login</button>
<p><Link to="/register">Register</Link></p>
</div>
)
}
