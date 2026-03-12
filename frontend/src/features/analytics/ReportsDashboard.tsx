import { useEffect, useState } from "react";

export default function ReportsDashboard(){
  const [data,setData]=useState(null)

  useEffect(()=>{
    fetch('/api/analytics/pos-intelligence')
      .then(r=>r.json())
      .then(setData)
  },[])

  return (
    <div>
      <h2>Reports</h2>
      <pre>{JSON.stringify(data,null,2)}</pre>
    </div>
  )
}
