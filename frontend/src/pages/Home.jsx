import React, { useEffect, useState } from "react";
import { getHealth } from "../api";
 // path is correct since api.js is in same folder

function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getHealth().then(setData);
  }, []);

  return (
    <div>
      <h1>Health Check</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default Home;
