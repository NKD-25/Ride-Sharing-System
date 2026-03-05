
import {useState} from "react"
import API from "../api"
import {useNavigate} from "react-router-dom"

export default function Register(){

const nav = useNavigate()

const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [password,setPassword]=useState("")

const register=async()=>{
await API.post("/auth/register",{name,email,password})
nav("/")
}

return(
<div>
<h2>Register</h2>
<input placeholder="name" onChange={e=>setName(e.target.value)}/>
<input placeholder="email" onChange={e=>setEmail(e.target.value)}/>
<input placeholder="password" type="password" onChange={e=>setPassword(e.target.value)}/>
<button onClick={register}>Register</button>
</div>
)
}
