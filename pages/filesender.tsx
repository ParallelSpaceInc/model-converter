import type { NextPage } from "next";

const ConvertingPage : NextPage = () => {

  return (
    <div>
      <input id="file" type="file"></input>
      <button onClick={async ()=>{
        const inp = document.getElementById("file") as any | null;
        if(!inp || !inp.value) return;
        const form = new FormData();
        
        form.append("file", inp.files[0]);
        const res = await fetch(`/api/converter`, {
          body: form,
          method: "POST"
        }).then(res=>res.blob()).then(blob =>{
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "res.glb";
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        })
      }} >send file</button>
    
    </div>
  )};

export default ConvertingPage;