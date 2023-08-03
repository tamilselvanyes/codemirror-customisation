import React, { useState } from "react";

function App() {
  const [docContent, setDocContent] = useState("");

  return (
    <div>
      <div className="work-type">
        <div>Work Type</div>
        <input type={"text"}></input>
      </div>
    </div>
  );
}

export default App;
