import { useEffect } from "react";

export default function Login() {
  useEffect(() => {
    window.location.replace("/dashboard");
  }, []);
  return null;
}
