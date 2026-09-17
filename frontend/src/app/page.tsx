import { Suspense } from "react";
import AuthGate from "./AuthGate";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AuthGate />
    </Suspense>
  );
}
