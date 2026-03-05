
import {useEffect,useState} from "react"
import API from "../api"

export default function Dashboard(){

const [rides,setRides]=useState([])
const [from,setFrom]=useState("")
const [to,setTo]=useState("")
const [seats,setSeats]=useState("")

const loadRides=async()=>{
const res = await API.get("/rides")
setRides(res.data)
}

const createRide=async()=>{
await API.post("/rides",{from,to,seats})
loadRides()
}

const bookRide=async(id)=>{
await API.post("/bookings",{rideId:id})
alert("Ride Requested")
}

useEffect(()=>{
loadRides()
},[])

return(
<div>

<h2>Create Ride</h2>
<input placeholder="from" onChange={e=>setFrom(e.target.value)}/>
<input placeholder="to" onChange={e=>setTo(e.target.value)}/>
<input placeholder="seats" onChange={e=>setSeats(e.target.value)}/>
<button onClick={createRide}>Create</button>

<h2>Available Rides</h2>

{rides.map(r=>(
<div key={r._id} style={{border:"1px solid gray",margin:"10px",padding:"10px"}}>
<p>{r.from} → {r.to}</p>
<p>Seats: {r.seats}</p>
<button onClick={()=>bookRide(r._id)}>Book</button>
</div>
))}

</div>
)
}
