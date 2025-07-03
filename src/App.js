import React from "react";
import BarcodePrintingUtility from "./BarcodePrintingUtility";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function App() {
  return (
    <GoogleOAuthProvider clientId="673416123276-esomu6pp66bdpi5i0jvnr53erl13b77f.apps.googleusercontent.com">
      <BarcodePrintingUtility />
    </GoogleOAuthProvider>
  );
}
