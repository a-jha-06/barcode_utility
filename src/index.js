import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="673416123276-esomu6pp66bdpi5i0jvnr53erl13b77f.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);